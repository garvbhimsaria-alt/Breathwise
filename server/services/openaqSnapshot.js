/**
 * BreatheWise — OpenAQ India snapshot (rate-limit proof)
 *
 * PROBLEM: OpenAQ's free tier allows 60 requests/minute and 2,000/hour per API key,
 * and there is no single call that returns the latest readings for all of India.
 * If every user search called OpenAQ, a few searches would hit HTTP 429.
 *
 * SOLUTION: users never call OpenAQ. This module keeps an in-memory snapshot of
 * Indian monitoring stations and refreshes it slowly in the background:
 *
 *   1. /v3/locations?iso=IN        → station list (1-3 calls, refreshed every 6 h)
 *   2. /v3/locations/{id}/latest   → latest readings, ONE station per tick, paced
 *
 * Pace (all values can be overridden with env vars):
 *   - warm-up (some stations never fetched yet): 40 requests/min
 *   - steady state: just enough to refresh every station about once an hour
 *     (6-25 requests/min)
 *   - hard cap: 1,700 requests per rolling hour (limit is 2,000)
 *   - any HTTP 429 pauses ALL OpenAQ traffic until the limit resets
 *   - user actions only "bump" a station to the front of the queue, and only if its
 *     data is older than 10 minutes. Bumps still go through the same pacing, so
 *     10,000 searches cost the same number of OpenAQ requests as 1.
 *
 * The snapshot is persisted to disk (best effort) so a restart does not start cold.
 * Nothing here is invented: every value is a measurement returned by OpenAQ.
 */

import fs from 'fs';
import path from 'path';

const BASE = 'https://api.openaq.org/v3';

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

function cfg() {
  return {
    warmupRpm: num(process.env.OPENAQ_WARMUP_RPM, 40),
    steadyMinRpm: 6,
    steadyMaxRpm: 25,
    hourlyCap: num(process.env.OPENAQ_HOURLY_CAP, 1700),
    refreshTargetMin: 60,
    activeWindowMs: 48 * 3600e3,
    listRefreshMs: 6 * 3600e3,
    priorityMinAgeMs: 10 * 60e3,
    backgroundMinAgeMs: 20 * 60e3, // never re-fetch a station that was updated less than 20 min ago
    failureBackoffMs: 30 * 60e3,
    maxPollutantSkewMs: 3 * 3600e3,
    persistEveryMs: num(process.env.OPENAQ_PERSIST_MS, 5 * 60e3),
    // lower bound between two requests; tests lower it
    minTickMs: num(process.env.OPENAQ_MIN_TICK_MS, 1000)
  };
}

const state = {
  started: false,
  timer: null,
  entries: new Map(),     // locationId -> entry
  priority: new Set(),    // locationIds a user just looked at
  reqLog: [],             // timestamps of requests in the last hour
  locationsLoadedAt: 0,
  listLoading: false,
  pausedUntil: 0,         // 429 pause
  disabledUntil: 0,       // 401/403 pause
  lastError: null,
  version: 0,
  lastPersistAt: 0,
  lastPersistVersion: -1
};

// ───────────────────────── helpers ─────────────────────────

const PARAM_MAP = {
  pm25: 'pm25', 'pm2.5': 'pm25', pm10: 'pm10',
  no2: 'no2', 'nitrogen dioxide': 'no2',
  so2: 'so2', 'sulfur dioxide': 'so2', 'sulphur dioxide': 'so2',
  co: 'co', 'carbon monoxide': 'co',
  o3: 'o3', ozone: 'o3',
  nh3: 'nh3', ammonia: 'nh3'
};
const normaliseParam = (raw) => PARAM_MAP[String(raw || '').toLowerCase().trim()] || null;

function providerName(loc) {
  return loc.provider?.name || loc.providers?.[0]?.name || loc.owner?.name || 'Unknown';
}

function isCpcbSource(loc) {
  const n = `${providerName(loc)} ${loc.owner?.name || ''}`.toLowerCase();
  return (
    n.includes('cpcb') || n.includes('central pollution') || n.includes('dpcc') ||
    n.includes('delhi pollution') || n.includes('spcb') || n.includes('pollution control')
  );
}

/**
 * CPCB-style names look like "Sector 30, Faridabad - HSPCB".
 * Returns { city, agency }. OpenAQ has no state field, so state stays null.
 */
export function deriveCity(loc) {
  const name = String(loc.name || '').trim();
  const m = name.match(/,\s*([^,]+?)\s*-\s*([A-Za-z]+)\s*$/);
  if (m) return { city: m[1].trim(), agency: m[2].toUpperCase() };
  const tail = name.match(/-\s*([A-Za-z]+)\s*$/);
  const agency = tail ? tail[1].toUpperCase() : null;
  if (loc.locality && String(loc.locality).trim()) return { city: String(loc.locality).trim(), agency };
  const parts = name.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return { city: parts[parts.length - 1].replace(/\s*-\s*[A-Za-z]+$/, ''), agency };
  return { city: name.replace(/\s*-\s*[A-Za-z]+$/, '') || 'Unknown', agency };
}

function toEntry(loc, c) {
  if (!loc || loc.isMobile) return null;
  const last = loc.datetimeLast?.utc;
  if (!last || Date.now() - Date.parse(last) > c.activeWindowMs) return null; // inactive station

  const sensorMap = {};
  const params = new Set();
  for (const s of loc.sensors || []) {
    const p = normaliseParam(s.parameter?.name);
    if (!p) continue;
    sensorMap[s.id] = { param: p, unit: s.parameter?.units || null };
    params.add(p);
  }
  // An overall AQI needs 3+ pollutants including PM2.5 or PM10: skip stations that can never get one
  if (!(params.has('pm25') || params.has('pm10')) || params.size < 3) return null;

  const lat = loc.coordinates?.latitude;
  const lon = loc.coordinates?.longitude;
  const { city, agency } = deriveCity(loc);

  return {
    id: loc.id,
    name: loc.name || 'Unknown Station',
    city,
    agency,
    state: null,
    coordinates: Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null,
    isCpcb: isCpcbSource(loc),
    provider: providerName(loc),
    sensorMap,
    datetimeLast: last,
    detail: null,
    fetchedAt: 0,
    failedAt: 0
  };
}

function recentRequestCount() {
  const now = Date.now();
  state.reqLog = state.reqLog.filter((t) => now - t < 3600e3);
  return state.reqLog.length;
}

async function api(pathAndQuery) {
  const key = process.env.OPENAQ_API_KEY;
  state.reqLog.push(Date.now());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(`${BASE}${pathAndQuery}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'X-API-Key': key }
    });
  } catch (err) {
    const c = err && err.cause;
    const e = new Error(err.name === 'AbortError' ? 'OpenAQ request timed out' : `${err.message}${c ? ` [${c.code || c.message}]` : ''}`);
    e.status = 0;
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) {
    const raw = res.headers?.get?.('x-ratelimit-reset') || res.headers?.get?.('retry-after');
    let secs = parseInt(raw, 10);
    if (!Number.isFinite(secs) || secs <= 0) secs = 60;
    secs = Math.min(secs, 900);
    state.pausedUntil = Date.now() + secs * 1000;
    const e = new Error(`OpenAQ rate limit reached; pausing ${secs}s`);
    e.status = 429;
    throw e;
  }
  if (res.status === 401 || res.status === 403) {
    state.disabledUntil = Date.now() + 10 * 60e3;
    const e = new Error(`OpenAQ rejected the API key (HTTP ${res.status})`);
    e.status = res.status;
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`OpenAQ returned HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

// ───────────────────────── station list ─────────────────────────

async function loadLocationList() {
  const c = cfg();
  state.listLoading = true;
  try {
    let limit = 1000;
    let page = 1;
    let all = [];
    const maxPages = () => (limit === 1000 ? 5 : 30);

    while (page <= maxPages()) {
      let json;
      try {
        json = await api(`/locations?iso=IN&limit=${limit}&page=${page}`);
      } catch (e) {
        if (e.status === 422 && limit === 1000) { // limit too large for this API version
          limit = 100; page = 1; all = [];
          continue;
        }
        throw e;
      }
      const rows = Array.isArray(json.results) ? json.results : [];
      all.push(...rows);
      const found = Number(json.meta?.found);
      if (rows.length < limit || (Number.isFinite(found) && all.length >= found)) break;
      page += 1;
    }

    const fresh = new Map();
    for (const loc of all) {
      const e = toEntry(loc, c);
      if (!e) continue;
      const old = state.entries.get(e.id);
      if (old) { // keep what we already know about this station
        e.detail = old.detail;
        e.fetchedAt = old.fetchedAt;
        e.failedAt = old.failedAt;
      }
      fresh.set(e.id, e);
    }
    if (fresh.size > 0) {
      state.entries = fresh;
      state.locationsLoadedAt = Date.now();
      state.version += 1;
      state.lastError = null;
    } else {
      state.lastError = 'OpenAQ returned no active Indian stations';
    }
  } finally {
    state.listLoading = false;
  }
}

// ───────────────────────── latest readings for one station ─────────────────────────

async function fetchLatest(entry, c) {
  const json = await api(`/locations/${entry.id}/latest?limit=100`);
  let rows = Array.isArray(json.results) ? json.results : [];
  if (rows[0] && Array.isArray(rows[0].measurements)) rows = rows[0].measurements; // older response shape

  const byParam = {};
  for (const r of rows) {
    const s = entry.sensorMap[r.sensorsId ?? r.sensorId];
    if (!s || typeof r.value !== 'number' || r.value < 0) continue; // negative = sensor error
    const ts = r.datetime?.utc || (typeof r.datetime === 'string' ? r.datetime : null);
    const t = Date.parse(ts);
    if (!Number.isFinite(t)) continue;
    if (!byParam[s.param] || t > byParam[s.param].t) byParam[s.param] = { value: r.value, unit: s.unit, timestamp: ts, t };
  }

  const times = Object.values(byParam).map((p) => p.t);
  if (times.length === 0) return null;
  const newest = Math.max(...times);

  const pollutants = {};
  for (const [param, p] of Object.entries(byParam)) {
    if (newest - p.t > c.maxPollutantSkewMs) continue; // do not mix hours-old and current readings
    pollutants[param] = { value: p.value, unit: p.unit, timestamp: p.timestamp };
  }

  return {
    locationId: entry.id,
    name: entry.name,
    coordinates: entry.coordinates,
    country: 'IN',
    provider: entry.provider,
    isCpcb: entry.isCpcb,
    pollutants,
    latestTimestamp: new Date(newest).toISOString()
  };
}

// ───────────────────────── scheduler ─────────────────────────

function isWarming() {
  for (const e of state.entries.values()) if (e.fetchedAt === 0 && e.failedAt === 0) return true;
  return false;
}

function currentRpm(c) {
  if (state.entries.size === 0 || isWarming()) return c.warmupRpm;
  const needed = Math.ceil(state.entries.size / c.refreshTargetMin);
  return Math.min(c.steadyMaxRpm, Math.max(c.steadyMinRpm, needed));
}

function pickNext(c) {
  const now = Date.now();

  // 1. Stations a user just looked at (only if their data is older than 10 minutes)
  for (const id of state.priority) {
    state.priority.delete(id);
    const e = state.entries.get(id);
    if (e && now - e.fetchedAt > c.priorityMinAgeMs && now - e.failedAt > 2 * 60e3) return e;
  }

  // 2. Background: never-fetched first, then the stalest
  let best = null;
  for (const e of state.entries.values()) {
    if (e.failedAt && now - e.failedAt < c.failureBackoffMs) continue;
    if (e.fetchedAt && now - e.fetchedAt < c.backgroundMinAgeMs) continue;
    if (!best || e.fetchedAt < best.fetchedAt) best = e;
  }
  return best;
}

function persist() {
  const file = process.env.OPENAQ_CACHE_FILE || path.join(process.cwd(), '.cache', 'openaq-snapshot.json');
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ savedAt: Date.now(), locationsLoadedAt: state.locationsLoadedAt, entries: [...state.entries.values()] }));
    state.lastPersistAt = Date.now();
    state.lastPersistVersion = state.version;
  } catch { /* best effort: Render's disk is temporary and may be read-only */ }
}

function restore() {
  const file = process.env.OPENAQ_CACHE_FILE || path.join(process.cwd(), '.cache', 'openaq-snapshot.json');
  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!saved || !Array.isArray(saved.entries)) return;
    if (Date.now() - saved.savedAt > 3 * 3600e3) return; // too old to be useful
    for (const e of saved.entries) state.entries.set(e.id, e);
    state.locationsLoadedAt = saved.locationsLoadedAt || 0;
    state.version += 1;
  } catch { /* no cache yet */ }
}

async function tick() {
  const c = cfg();
  let delay = Math.max(c.minTickMs, 60000 / currentRpm(c));
  try {
    const now = Date.now();
    if (!process.env.OPENAQ_API_KEY) return;
    if (now < state.pausedUntil || now < state.disabledUntil) {
      delay = Math.max(delay, Math.min(5000, Math.max(c.minTickMs, Math.max(state.pausedUntil, state.disabledUntil) - now)));
      return;
    }
    if (recentRequestCount() >= c.hourlyCap) { delay = Math.max(delay, 30000); return; }

    // station list first (rarely)
    if (!state.listLoading && now - state.locationsLoadedAt > c.listRefreshMs) {
      try { await loadLocationList(); } catch (e) { state.lastError = e.message; state.locationsLoadedAt = Math.max(state.locationsLoadedAt, now - c.listRefreshMs + 10 * 60e3); }
      return;
    }

    const entry = pickNext(c);
    if (!entry) return;
    try {
      const detail = await fetchLatest(entry, c);
      if (detail) { entry.detail = detail; entry.failedAt = 0; } else { entry.failedAt = Date.now(); }
      entry.fetchedAt = Date.now();
      state.version += 1;
      state.lastError = null;
    } catch (e) {
      state.lastError = e.message;
      if (e.status !== 429 && e.status !== 401 && e.status !== 403) entry.failedAt = Date.now();
    }

    if (Date.now() - state.lastPersistAt > c.persistEveryMs && state.version !== state.lastPersistVersion) persist();
  } finally {
    state.timer = setTimeout(tick, delay);
    state.timer.unref?.();
  }
}

// ───────────────────────── public API ─────────────────────────

/** Starts the background refresher once. Safe to call from every request. */
export function ensureOpenAqSnapshotStarted() {
  if (state.started) return;
  state.started = true;
  restore();
  state.timer = setTimeout(tick, 0);
  state.timer.unref?.();
}

/** Ask for fresher data for stations a user just looked at (still rate limited, see header). */
export function requestPriority(ids) {
  for (const id of ids || []) if (state.entries.has(id)) state.priority.add(id);
}

export function getOpenAqStatus() {
  const c = cfg();
  const withData = [...state.entries.values()].filter((e) => e.detail && Object.keys(e.detail.pollutants).length > 0).length;
  return {
    configured: Boolean(process.env.OPENAQ_API_KEY),
    started: state.started,
    stationsTracked: state.entries.size,
    stationsWithData: withData,
    warming: state.entries.size === 0 || isWarming(),
    requestsLastHour: recentRequestCount(),
    hourlyCap: c.hourlyCap,
    targetRequestsPerMinute: Math.round(currentRpm(c)),
    pausedForRateLimitSeconds: Math.max(0, Math.ceil((state.pausedUntil - Date.now()) / 1000)),
    stationListAgeMinutes: state.locationsLoadedAt ? Math.round((Date.now() - state.locationsLoadedAt) / 60000) : null,
    lastError: state.lastError
  };
}

/**
 * Current snapshot for the routes. Never calls OpenAQ itself.
 * @returns {{ entries: Array, status: Object, fetchedAt: string } | { error: string, status: Object }}
 */
export function getOpenAqSnapshot() {
  if (!process.env.OPENAQ_API_KEY) return { error: 'OPENAQ_API_KEY is not configured', status: getOpenAqStatus() };
  ensureOpenAqSnapshotStarted();

  const ready = [...state.entries.values()].filter((e) => e.detail && Object.keys(e.detail.pollutants).length > 0);
  const status = getOpenAqStatus();
  if (ready.length === 0) {
    const why = status.lastError ? ` (${status.lastError})` : '';
    return {
      error: `OpenAQ station data is still loading (${status.stationsWithData} of ${status.stationsTracked || '?'} stations ready)${why}. Try again in a minute.`,
      status
    };
  }
  const newest = Math.max(...ready.map((e) => e.fetchedAt));
  return { entries: ready, status, fetchedAt: new Date(newest).toISOString() };
}
