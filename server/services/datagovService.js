/**
 * BreatheWise — data.gov.in / CPCB Provider Service
 *
 * Resource ID: 3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69
 * API returns individual pollutant rows per station.
 * Does NOT return a pre-calculated AQI.
 *
 * License: Government Open Data License — India (GODL).
 * Attribution required.
 */

import { parseTimestamp } from '../utils/freshness.js';

const RESOURCE_ID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Simple in-memory cache: { key → { data, fetchedAt } }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch pollutant readings for a specific city from data.gov.in.
 *
 * @param {string} city – City filter, e.g. "Delhi"
 * @param {Object} [options]
 * @param {number} [options.limit=100]
 * @returns {{ records: Array, total: number, provider: string, fetchedAt: string } | { error: string }}
 */
export async function fetchCpcbData(city, options = {}) {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    return { error: 'DATA_GOV_IN_API_KEY is not configured', provider: 'data.gov.in' };
  }

  const limit = options.limit || 500;
  const cacheKey = `cpcb_${city}_${limit}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  // Build URL with filters
  const params = new URLSearchParams({
    'api-key': apiKey,
    'format': 'json',
    'limit': String(limit),
    'offset': '0'
  });

  // data.gov.in supports filter syntax like filters[city]=Delhi
  const url = `${BASE_URL}?${params.toString()}&filters[city]=${encodeURIComponent(city)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        error: `data.gov.in returned HTTP ${response.status}`,
        status: response.status,
        provider: 'data.gov.in'
      };
    }

    const json = await response.json();
    const records = json.records || [];

    // Safe numeric parser: handles "0", NaN, empty string, null, undefined
    const safeFloat = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    const result = {
      records: records.map(r => ({
        station:    r.station?.trim()   || null,
        city:       r.city?.trim()      || null,
        state:      r.state?.trim()     || null,
        latitude:   safeFloat(r.latitude),
        longitude:  safeFloat(r.longitude),
        pollutantId:  r.pollutant_id?.trim()  || null,
        pollutantAvg: safeFloat(r.avg_value ?? r.pollutant_avg),
        pollutantMin: safeFloat(r.min_value ?? r.pollutant_min),
        pollutantMax: safeFloat(r.max_value ?? r.pollutant_max),
        pollutantUnit: r.pollutant_unit?.trim() || 'µg/m³',
        lastUpdate: r.last_update || null
      })),
      total: json.total || records.length,
      provider: 'CPCB via data.gov.in',
      license: 'Government Open Data License — India (GODL)',
      attribution: 'Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India. Data from data.gov.in under GODL.',
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    // Store in cache
    cache.set(cacheKey, { data: result, fetchedAt: Date.now() });

    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      return { error: 'data.gov.in request timed out (15s)', provider: 'data.gov.in' };
    }
    return { error: `data.gov.in fetch failed: ${err.message}`, provider: 'data.gov.in' };
  }
}

/**
 * Group raw CPCB records by station, producing one object per station
 * with all available pollutant concentrations.
 *
 * @param {Array} records – Output of fetchCpcbData().records
 * @returns {Array<Object>} – One entry per station with pollutant map
 */
export function groupByStation(records) {
  if (!Array.isArray(records)) return [];

  const map = {};
  for (const r of records) {
    if (!r.station) continue;
    const key = `${r.city || ''}|${r.station}`;
    if (!map[key]) {
      map[key] = {
        station: r.station,
        city: r.city,
        state: r.state,
        latitude: r.latitude,
        longitude: r.longitude,
        pollutants: {},
        lastUpdate: null
      };
    }
    const st = map[key];

    // Keep the most recent lastUpdate across all pollutant rows
    if (r.lastUpdate) {
      const parsedR = parseTimestamp(r.lastUpdate);
      const parsedSt = parseTimestamp(st.lastUpdate);
      if (!st.lastUpdate || (parsedR && (!parsedSt || parsedR > parsedSt))) {
        st.lastUpdate = r.lastUpdate;
      }
    }

    if (r.pollutantId && r.pollutantAvg !== null && !isNaN(r.pollutantAvg)) {
      st.pollutants[r.pollutantId.toLowerCase().replace('.', '')] = {
        avg: r.pollutantAvg,
        min: r.pollutantMin,
        max: r.pollutantMax,
        unit: r.pollutantUnit || 'µg/m³'
      };
    }
  }

  return Object.values(map);
}


// ─────────────────────────────────────────────────────────────
// All-India station snapshot
//
// Downloads every CPCB station row (paginated), caches it for 15 minutes and
// shares one in-flight request between callers. This is what powers:
//   - nearest-station search across ALL of India (no hardcoded city list)
//   - the "all Indian cities with live AQI" list
// If a refresh fails, the last good snapshot (up to 60 min old) is served and
// flagged with fromStaleCache: true. Each station still carries its own
// last-update timestamp, so freshness labels stay honest.
// ─────────────────────────────────────────────────────────────

const ALL_CACHE_TTL_MS = 15 * 60 * 1000;
const ALL_STALE_OK_MS = 60 * 60 * 1000;
const PAGE_LIMIT = 500;
const MAX_PAGES = 30; // safety cap: 15,000 rows

let allCache = null;     // { data, fetchedAt }
let allInflight = null;  // Promise shared by concurrent callers

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

function mapRecord(r) {
  return {
    station:       r.station?.trim()  || null,
    city:          r.city?.trim()     || null,
    state:         r.state?.trim()    || null,
    latitude:      toNum(r.latitude),
    longitude:     toNum(r.longitude),
    pollutantId:   r.pollutant_id?.trim() || null,
    pollutantAvg:  toNum(r.avg_value ?? r.pollutant_avg),
    pollutantMin:  toNum(r.min_value ?? r.pollutant_min),
    pollutantMax:  toNum(r.max_value ?? r.pollutant_max),
    pollutantUnit: r.pollutant_unit?.trim() || 'µg/m³',
    lastUpdate:    r.last_update || null
  };
}

async function fetchPage(apiKey, limit, offset) {
  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: String(limit),
    offset: String(offset)
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      const e = new Error(`data.gov.in returned HTTP ${response.status}`);
      e.status = response.status;
      throw e;
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('data.gov.in request timed out (20s)');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {{ records: Array, total: number, partial: boolean, provider: string,
 *            license: string, attribution: string, fetchedAt: string,
 *            fromCache: boolean, fromStaleCache?: boolean } | { error: string, provider: string }}
 */
export async function fetchAllCpcbRecords() {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    return { error: 'DATA_GOV_IN_API_KEY is not configured', provider: 'data.gov.in' };
  }

  if (allCache && Date.now() - allCache.fetchedAt < ALL_CACHE_TTL_MS) {
    return { ...allCache.data, fromCache: true };
  }
  if (allInflight) return allInflight;

  allInflight = (async () => {
    try {
      const all = [];
      let offset = 0;
      let total = Infinity;
      let pages = 0;
      let partial = false;

      while (offset < total && pages < MAX_PAGES) {
        let json;
        try {
          json = await fetchPage(apiKey, PAGE_LIMIT, offset);
        } catch (err) {
          if (pages === 0) throw err; // first page failed: treat as total failure
          partial = true;             // later page failed: keep what we have
          console.error(`[data.gov.in] page ${pages + 1} failed: ${err.message}`);
          break;
        }
        const rows = Array.isArray(json.records) ? json.records : [];
        const reported = Number(json.total);
        if (Number.isFinite(reported)) total = reported;
        all.push(...rows.map(mapRecord));
        pages += 1;
        offset += PAGE_LIMIT;
        if (rows.length < PAGE_LIMIT) break; // last page
      }

      if (all.length === 0) {
        return { error: 'data.gov.in returned no station records', provider: 'data.gov.in' };
      }

      const data = {
        records: all,
        total: Number.isFinite(total) ? total : all.length,
        partial,
        provider: 'CPCB via data.gov.in',
        license: 'Government Open Data License — India (GODL)',
        attribution: 'Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India. Data from data.gov.in under GODL.',
        fetchedAt: new Date().toISOString(),
        fromCache: false
      };
      allCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      console.error(`[data.gov.in] refresh failed: ${err.message}`);
      if (allCache && Date.now() - allCache.fetchedAt < ALL_STALE_OK_MS) {
        return { ...allCache.data, fromCache: true, fromStaleCache: true };
      }
      return { error: `data.gov.in fetch failed: ${err.message}`, provider: 'data.gov.in' };
    } finally {
      allInflight = null;
    }
  })();

  return allInflight;
}
