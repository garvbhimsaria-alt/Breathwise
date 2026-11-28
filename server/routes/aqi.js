/**
 * BreatheWise — /api/aqi routes
 *
 * GET /api/aqi/cities         → Every Indian city with monitoring stations + live city AQI.
 * GET /api/aqi/city           → Stations for one city (plus a city-average entry).
 * GET /api/aqi/nearby         → Nearest stations to a coordinate, searched across ALL of India.
 * GET /api/aqi/openaq-status  → Health of the OpenAQ background snapshot (no secrets).
 * GET /api/aqi/providers      → Which provider keys are configured.
 *
 * DATA SOURCES
 *   1. CPCB via data.gov.in (primary, when the server can reach it).
 *   2. OpenAQ snapshot (used when CPCB is unreachable, e.g. a server outside India).
 *      The snapshot is filled slowly in the background (see openaqSnapshot.js), so a user
 *      search NEVER triggers an OpenAQ request and can never cause an HTTP 429.
 */

import { Router } from 'express';
import { fetchAllCpcbRecords, groupByStation } from '../services/datagovService.js';
import { getOpenAqSnapshot, getOpenAqStatus, requestPriority, ensureOpenAqSnapshotStarted } from '../services/openaqSnapshot.js';
import { calculateAqi, normaliseId, calculateSubIndex } from '../utils/aqiCalculator.js';
import { evaluateFreshness, haversineKm } from '../utils/freshness.js';

const router = Router();

// On servers that cannot use CPCB (DATA_GOV_IN_DISABLED=true) start filling the OpenAQ cache at boot,
// so it is already warm by the time the first user arrives.
if (String(process.env.DATA_GOV_IN_DISABLED).toLowerCase() === 'true' && process.env.OPENAQ_API_KEY) {
  ensureOpenAqSnapshotStarted();
}

const CPCB_PROVIDER = 'CPCB via data.gov.in';
const OPENAQ_PROVIDER = 'OpenAQ';
const OPENAQ_ATTRIBUTION =
  'Air quality data from OpenAQ, which aggregates readings published by government agencies (including CPCB and state pollution control boards) and other providers. Each station lists its own provider.';
const AVERAGING_NOTE =
  'Real-time observation; official CPCB AQI requires 24-hr averaging with minimum 16 hours of monitoring (67% observation coverage).';

// ── Shared helpers ───────────────────────────────────────────

const round1 = (n) => Math.round(n * 10) / 10;
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/\s+/g, '-');

/** A station reading is usable for averages/ranking if its timestamp is known and not very stale. */
function isUsable(st) {
  const status = st?.freshness?.status;
  return status !== undefined && status !== 'unavailable' && status !== 'very_stale';
}

function mean(nums) {
  const v = nums.filter((n) => typeof n === 'number' && Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Turns one OpenAQ snapshot entry into the same station shape the CPCB path produces. */
function openAqEntryToStation(entry) {
  const st = normaliseOpenAqStation(entry.detail);
  return {
    ...st,
    stationId: `oaq-${entry.id}`,
    openaqId: entry.id,
    city: entry.city,
    state: entry.state,
    agency: entry.agency
  };
}

// Normalised-station memo (the CPCB snapshot changes every 15 min, the OpenAQ one continuously)
let nsCache = { key: null, at: 0, source: null, stations: [] };
const OPENAQ_MEMO_MS = 15 * 1000;

/**
 * One list of normalised stations for every route.
 * CPCB first; if the server cannot reach it, the OpenAQ snapshot. Never calls OpenAQ directly.
 */
async function getNormalisedStations() {
  const all = await fetchAllCpcbRecords();
  if (!all.error) {
    if (nsCache.source !== 'cpcb' || nsCache.key !== all.fetchedAt) {
      nsCache = {
        source: 'cpcb',
        key: all.fetchedAt,
        at: Date.now(),
        stations: groupByStation(all.records).map((st) => normaliseStation(st, CPCB_PROVIDER, all.attribution))
      };
    }
    return { stations: nsCache.stations, source: 'cpcb', meta: all };
  }

  // CPCB unreachable → OpenAQ snapshot
  const snap = getOpenAqSnapshot();
  if (snap.error) {
    return { error: `CPCB: ${all.error}. OpenAQ: ${snap.error}`, meta: all, openaqStatus: snap.status };
  }
  if (nsCache.source !== 'openaq' || Date.now() - nsCache.at > OPENAQ_MEMO_MS) {
    nsCache = { source: 'openaq', key: String(Date.now()), at: Date.now(), stations: snap.entries.map(openAqEntryToStation) };
  }
  return {
    stations: nsCache.stations,
    source: 'openaq',
    openaqStatus: snap.status,
    meta: {
      provider: OPENAQ_PROVIDER,
      license: 'Varies by provider; see OpenAQ licences',
      attribution: OPENAQ_ATTRIBUTION,
      fetchedAt: snap.fetchedAt,
      partial: snap.status.warming,
      fromCache: true,
      fromStaleCache: false
    }
  };
}

/**
 * City-level reading = mean of the real-time AQI of the city's usable stations.
 * Returns null when no station has a computable AQI.
 */
function buildCityAggregate(cityName, stateName, stations, attribution, providerLabel) {
  const usable = stations.filter(isUsable);
  const withAqi = usable.filter((s) => s.aqi !== null && s.aqi !== undefined);
  if (withAqi.length === 0) return null;

  const aqi = Math.round(mean(withAqi.map((s) => s.aqi)));

  const pollutants = {};
  for (const key of ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'nh3']) {
    const m = mean(usable.map((s) => s.pollutants?.[key]));
    pollutants[key] = m === null ? null : round1(m);
  }

  const counts = {};
  for (const s of withAqi) if (s.dominantPollutant) counts[s.dominantPollutant] = (counts[s.dominantPollutant] || 0) + 1;
  const dominantPollutant = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;

  // Freshest usable station sets the "as of" time
  const freshest = usable.reduce(
    (best, s) => ((s.freshness?.ageMinutes ?? Infinity) < (best?.freshness?.ageMinutes ?? Infinity) ? s : best),
    usable[0]
  );

  const coords = stations.map((s) => s.coordinates).filter(Boolean);
  const centroid = coords.length
    ? { lat: mean(coords.map((c) => c.lat)), lon: mean(coords.map((c) => c.lon)) }
    : null;

  const units = withAqi[0]?.pollutantUnits || {};
  const providers = [...new Set(withAqi.map((s) => s.provider).filter(Boolean))];

  return {
    station: `${cityName} city average (${withAqi.length} station${withAqi.length === 1 ? '' : 's'})`,
    stationId: `city-${slug(`${stateName || ''} ${cityName}`)}`,
    city: cityName,
    state: stateName || null,
    coordinates: centroid,
    distanceKm: null,

    aqi,
    aqiLabel: `Mean of real-time AQI across ${withAqi.length} station${withAqi.length === 1 ? '' : 's'}`,
    aqiCategory: getCpcbCategory(aqi),
    dominantPollutant,
    subIndices: null,
    pollutantCount: Object.values(pollutants).filter((v) => v !== null).length,
    averagingPeriodNote: AVERAGING_NOTE,

    pollutants,
    pollutantUnits: units,

    provider: providerLabel || providers.join(', ') || CPCB_PROVIDER,
    isCpcbSource: withAqi.every((s) => s.isCpcbSource),
    attribution: attribution || null,

    measurementTimestamp: freshest?.measurementTimestamp || null,
    freshness: freshest?.freshness || null,
    dataType: 'live_measurement',
    isCityAggregate: true,
    stationCount: stations.length,
    stationsWithAqi: withAqi.length
  };
}

function snapshotInfo(result) {
  if (result.source !== 'openaq') return null;
  const st = result.openaqStatus || getOpenAqStatus();
  return {
    source: 'openaq',
    warming: st.warming,
    stationsWithData: st.stationsWithData,
    stationsTracked: st.stationsTracked
  };
}

// ── GET /api/aqi/cities ──────────────────────────────────────
let citiesCache = { key: null, at: 0, payload: null };

router.get('/cities', async (_req, res) => {
  const result = await getNormalisedStations();
  if (result.error) {
    return res.status(502).json({ dataType: 'unavailable', error: result.error, provider: 'data.gov.in / OpenAQ' });
  }
  const { stations, meta, source } = result;

  const stale =
    citiesCache.key !== `${source}|${meta.fetchedAt}` ||
    (source === 'openaq' && Date.now() - citiesCache.at > OPENAQ_MEMO_MS);

  if (stale) {
    const groups = new Map();
    for (const st of stations) {
      if (!st.city) continue;
      const key = `${norm(st.state)}|${norm(st.city)}`;
      if (!groups.has(key)) groups.set(key, { city: st.city, state: st.state, stations: [] });
      groups.get(key).stations.push(st);
    }

    const cities = [];
    for (const g of groups.values()) {
      const agg = buildCityAggregate(g.city, g.state, g.stations, meta.attribution, source === 'cpcb' ? CPCB_PROVIDER : undefined);
      const agency = g.stations.find((s) => s.agency)?.agency || null;
      cities.push({
        id: slug(`${g.state || ''} ${g.city}`),
        city: g.city,
        state: g.state,
        region: g.state || (agency ? `India • ${agency}` : 'India'),
        aqi: agg ? agg.aqi : null,
        category: agg ? agg.aqiCategory : null,
        dominantPollutant: agg ? agg.dominantPollutant : null,
        pm25: agg ? agg.pollutants.pm25 : null,
        stationCount: g.stations.length,
        stationsWithAqi: agg ? agg.stationsWithAqi : 0,
        lastUpdated: agg?.freshness?.label || null,
        freshnessStatus: agg?.freshness?.status || null,
        coordinates: agg ? agg.coordinates : null
      });
    }
    cities.sort((a, b) => a.city.localeCompare(b.city));
    citiesCache = { key: `${source}|${meta.fetchedAt}`, at: Date.now(), payload: cities };
  }

  return res.json({
    dataType: 'live_measurements',
    provider: source === 'cpcb' ? CPCB_PROVIDER : OPENAQ_PROVIDER,
    source,
    license: meta.license,
    attribution: meta.attribution,
    cities: citiesCache.payload,
    total: citiesCache.payload.length,
    partial: meta.partial || false,
    snapshot: snapshotInfo(result),
    fromCache: meta.fromCache || false,
    fromStaleCache: meta.fromStaleCache || false,
    fetchedAt: meta.fetchedAt
  });
});

// ── GET /api/aqi/city ────────────────────────────────────────
router.get('/city', async (req, res) => {
  const city = String(req.query.city || 'Delhi').trim();
  const state = req.query.state ? String(req.query.state).trim() : null;

  const result = await getNormalisedStations();
  if (result.error) {
    return res.json({
      dataType: 'unavailable',
      primaryProvider: null,
      stations: [],
      stationCount: 0,
      errors: { providers: result.error },
      message: 'No live data source is available right now. Use demonstration mode.',
      fetchedAt: new Date().toISOString()
    });
  }

  const wanted = norm(city);
  const wantedState = state ? norm(state) : null;
  const inState = (s) => !wantedState || !s.state || norm(s.state) === wantedState;
  let cityStations = result.stations.filter((s) => norm(s.city) === wanted && inState(s));
  if (cityStations.length === 0) {
    cityStations = result.stations.filter((s) => norm(s.city).includes(wanted) && inState(s));
  }

  if (cityStations.length === 0) {
    return res.json({
      dataType: 'unavailable',
      primaryProvider: null,
      stations: [],
      stationCount: 0,
      errors: { providers: `No monitoring station found for "${city}"` },
      message: `No live monitoring station found for ${city}.`,
      snapshot: snapshotInfo(result),
      fetchedAt: new Date().toISOString()
    });
  }

  // A user looked at this city: ask the background refresher to update its stations soon
  if (result.source === 'openaq') requestPriority(cityStations.map((s) => s.openaqId).slice(0, 8));

  const meta = result.meta;
  const aggregate = buildCityAggregate(
    cityStations[0].city || city,
    state || cityStations[0].state,
    cityStations,
    meta.attribution,
    result.source === 'cpcb' ? CPCB_PROVIDER : undefined
  );
  const stations = aggregate ? [aggregate, ...cityStations] : cityStations;

  return res.json({
    dataType: 'live_measurements',
    primaryProvider: result.source === 'cpcb' ? CPCB_PROVIDER : OPENAQ_PROVIDER,
    source: result.source,
    license: meta.license,
    attribution: meta.attribution,
    stations,
    stationCount: cityStations.length,
    snapshot: snapshotInfo(result),
    fetchedAt: meta.fetchedAt,
    fromCache: meta.fromCache || false,
    fallbackUsed: result.source !== 'cpcb'
  });
});

// ── GET /api/aqi/nearby ──────────────────────────────────────
router.get('/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon query parameters are required and must be numbers.' });
  }

  // Search radius in metres (default 50 km, clamped to 5-250 km).
  // When the caller does not set a radius and nothing is found, widen to 250 km
  // and report the real distance instead of failing.
  const explicitRadius = Boolean(parseInt(req.query.radius));
  const radiusM = Math.min(Math.max(parseInt(req.query.radius) || 50000, 5000), 250000);
  const radiusKm = radiusM / 1000;
  const MAX_WIDEN_KM = 250;

  const result = await getNormalisedStations();
  if (result.error) {
    return res.status(502).json({ error: 'No live data source is available right now.', providers: result.error });
  }

  const nearby = result.stations
    .filter((st) => st.coordinates && Object.values(st.pollutants).some((v) => v !== null))
    .map((st) => ({
      ...st,
      distanceKm: round1(haversineKm(lat, lon, st.coordinates.lat, st.coordinates.lon))
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Prefer stations whose reading is recent; keep older ones only if nothing else exists
  const pickWithin = (km) => {
    const inRange = nearby.filter((st) => st.distanceKm <= km);
    const fresh = inRange.filter(isUsable);
    return (fresh.length > 0 ? fresh : inRange).slice(0, 5);
  };
  let eligible = pickWithin(radiusKm);
  let widened = false;
  if (eligible.length === 0 && !explicitRadius) {
    eligible = pickWithin(MAX_WIDEN_KM);
    widened = eligible.length > 0;
  }

  if (eligible.length === 0) {
    return res.status(404).json({
      error: `No monitoring station with data within ${explicitRadius ? radiusKm : MAX_WIDEN_KM} km.`,
      snapshot: snapshotInfo(result)
    });
  }

  if (result.source === 'openaq') requestPriority(eligible.slice(0, 3).map((s) => s.openaqId));

  return res.json({
    dataType: 'live_measurements',
    provider: result.source === 'cpcb' ? CPCB_PROVIDER : OPENAQ_PROVIDER,
    source: result.source,
    license: result.meta.license,
    attribution: result.meta.attribution,
    stations: eligible,
    stationCount: eligible.length,
    searchCoordinates: { lat, lon },
    radiusM: widened ? MAX_WIDEN_KM * 1000 : radiusM,
    widenedSearch: widened,
    snapshot: snapshotInfo(result),
    fetchedAt: result.meta.fetchedAt,
    fromCache: result.meta.fromCache || false,
    fallbackUsed: result.source !== 'cpcb'
  });
});

// ── GET /api/aqi/openaq-status ───────────────────────────────
router.get('/openaq-status', (_req, res) => {
  res.json(getOpenAqStatus());
});

// ── GET /api/aqi/providers ───────────────────────────────────
router.get('/providers', (_req, res) => {
  res.json({
    cpcb: {
      name: 'CPCB via data.gov.in',
      role: 'primary',
      keyConfigured: !!process.env.DATA_GOV_IN_API_KEY,
      endpoint: 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69'
    },
    openaq: {
      name: 'OpenAQ v3',
      role: 'secondary',
      keyConfigured: !!process.env.OPENAQ_API_KEY,
      endpoint: 'https://api.openaq.org/v3'
    },
    weather: {
      name: 'Open-Meteo',
      role: 'weather only',
      keyRequired: false
    }
  });
});

// ── GET /api/aqi/weather ─────────────────────────────────────
const weatherCache = new Map();
router.get('/weather', async (req,res) => {
  const lat=Number(req.query.lat), lon=Number(req.query.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return res.status(400).json({error:'Valid lat and lon are required.'});
  const key=`${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached=weatherCache.get(key);
  if(cached&&Date.now()-cached.at<10*60*1000) return res.json({...cached.data,fromCache:true});
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',hourly:'boundary_layer_height,visibility',forecast_days:'1',timezone:'Asia/Kolkata'}).toString();
  try {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
    let response;
    try { response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}}); }
    finally { clearTimeout(timer); }
    if(!response.ok) return res.status(502).json({error:`Open-Meteo returned HTTP ${response.status}`});
    const json=await response.json();
    const now=json.current?.time;
    const hourIndex=Array.isArray(json.hourly?.time)?json.hourly.time.indexOf(now):-1;
    const data={provider:'Open-Meteo',temperature:json.current?.temperature_2m??null,humidity:json.current?.relative_humidity_2m??null,windSpeed:json.current?.wind_speed_10m??null,windDirection:json.current?.wind_direction_10m??null,boundaryLayerHeight:hourIndex>=0?(json.hourly.boundary_layer_height?.[hourIndex]??null):null,visibility:hourIndex>=0?(json.hourly.visibility?.[hourIndex]??null):null,observedAt:now||null};
    weatherCache.set(key,{at:Date.now(),data});
    res.json(data);
  } catch(error) { res.status(502).json({error:error.name==='AbortError'?'Open-Meteo weather request timed out':'Weather service unavailable'}); }
});

// ── Normalisation helpers ────────────────────────────────────

function normaliseStation(stationData, providerName, attribution) {
  const pollutants = stationData.pollutants || {};
  const concentrations = {};
  const units = {};
  const subIndices = {};

  for (const [rawId, data] of Object.entries(pollutants)) {
    const normId = normaliseId(rawId);
    concentrations[normId] = data.avg;
    units[normId] = data.unit || 'µg/m³';
    const subRes = calculateSubIndex(normId, data.avg, units[normId]);
    if (subRes !== null) {
      subIndices[normId] = subRes.subIndex;
    }
  }

  const aqiResult = calculateAqi(concentrations, units);
  const freshness = evaluateFreshness(stationData.lastUpdate);

  return {
    // Station identity
    station: stationData.station,
    stationId: stationData.station ? `cpcb-${stationData.station.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : null,
    city: stationData.city,
    state: stationData.state,
    coordinates: (stationData.latitude && stationData.longitude)
      ? { lat: stationData.latitude, lon: stationData.longitude }
      : null,

    // AQI (may be null if requirements not met)
    aqi: aqiResult ? aqiResult.aqi : null,
    aqiLabel: aqiResult ? aqiResult.label : 'Overall AQI unavailable (insufficient pollutant coverage: requires at least 3 pollutants including PM2.5 or PM10)',
    aqiCategory: aqiResult && aqiResult.aqi !== null ? getCpcbCategory(aqiResult.aqi) : null,
    dominantPollutant: aqiResult ? aqiResult.dominantPollutant : null,
    subIndices: Object.keys(subIndices).length > 0 ? subIndices : null,
    pollutantCount: Object.keys(subIndices).length,
    averagingPeriodNote: 'Real-time observation; official CPCB AQI requires 24-hr averaging with minimum 16 hours of monitoring (67% observation coverage).',

    // Individual pollutant readings (always available even without AQI)
    pollutants: {
      pm25: concentrations.pm25 ?? null,
      pm10: concentrations.pm10 ?? null,
      no2:  concentrations.no2  ?? null,
      so2:  concentrations.so2  ?? null,
      co:   concentrations.co   ?? null,
      o3:   concentrations.o3   ?? null,
      nh3:  concentrations.nh3  ?? null
    },
    pollutantUnits: {
      pm25: units.pm25 || 'µg/m³',
      pm10: units.pm10 || 'µg/m³',
      no2:  units.no2  || 'µg/m³',
      so2:  units.so2  || 'µg/m³',
      co:   units.co   || 'mg/m³',
      o3:   units.o3   || 'µg/m³',
      nh3:  units.nh3  || 'µg/m³'
    },

    // Provenance
    provider: providerName,
    isCpcbSource: true,
    attribution: attribution || null,

    // Timestamps
    measurementTimestamp: stationData.lastUpdate || null,
    freshness: freshness,
    dataType: freshness.status === 'unavailable' ? 'stale_measurement' : 'live_measurement'
  };
}

function normaliseOpenAqStation(detail, userLat, userLon) {
  const concentrations = {};
  const units = {};
  const subIndices = {};

  for (const [paramId, data] of Object.entries(detail.pollutants || {})) {
    const normId = normaliseId(paramId);
    concentrations[normId] = data.value;
    units[normId] = data.unit || null;
    const subRes = calculateSubIndex(normId, data.value, units[normId]);
    if (subRes !== null) {
      subIndices[normId] = subRes.subIndex;
    }
  }

  const aqiResult = calculateAqi(concentrations, units);
  const freshness = evaluateFreshness(detail.latestTimestamp);

  let distanceKm = null;
  if (userLat && userLon && detail.coordinates) {
    distanceKm = Math.round(haversineKm(userLat, userLon, detail.coordinates.lat, detail.coordinates.lon) * 10) / 10;
  }

  return {
    station: detail.name,
    stationId: detail.locationId,
    coordinates: detail.coordinates,
    distanceKm,

    aqi: aqiResult ? aqiResult.aqi : null,
    aqiLabel: aqiResult ? aqiResult.label : 'Overall AQI unavailable (insufficient pollutant coverage: requires at least 3 pollutants including PM2.5 or PM10)',
    aqiCategory: aqiResult && aqiResult.aqi !== null ? getCpcbCategory(aqiResult.aqi) : null,
    dominantPollutant: aqiResult ? aqiResult.dominantPollutant : null,
    subIndices: Object.keys(subIndices).length > 0 ? subIndices : null,
    pollutantCount: Object.keys(subIndices).length,
    averagingPeriodNote: 'Real-time observation; official CPCB AQI requires 24-hr averaging with minimum 16 hours of monitoring (67% observation coverage).',

    pollutants: {
      pm25: concentrations.pm25 ?? null,
      pm10: concentrations.pm10 ?? null,
      no2:  concentrations.no2  ?? null,
      so2:  concentrations.so2  ?? null,
      co:   concentrations.co   ?? null,
      o3:   concentrations.o3   ?? null,
      nh3:  concentrations.nh3  ?? null
    },
    pollutantUnits: {
      pm25: units.pm25 || 'µg/m³',
      pm10: units.pm10 || 'µg/m³',
      no2:  units.no2  || 'µg/m³',
      so2:  units.so2  || 'µg/m³',
      co:   units.co   || 'mg/m³',
      o3:   units.o3   || 'µg/m³',
      nh3:  units.nh3  || 'µg/m³'
    },

    provider: `OpenAQ${detail.isCpcb ? ' (CPCB source)' : ''}`,
    isCpcbSource: detail.isCpcb || false,
    attribution: detail.isCpcb
      ? 'Central Pollution Control Board (CPCB) data via OpenAQ. GODL license.'
      : `Data provider: ${detail.provider || 'Unknown'} via OpenAQ. Check /v3/licenses for terms.`,

    measurementTimestamp: detail.latestTimestamp || null,
    freshness,
    dataType: freshness.status === 'unavailable' ? 'stale_measurement' : 'live_measurement'
  };
}

function getCpcbCategory(aqi) {
  if (aqi === null || aqi === undefined) return null;
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export default router;
