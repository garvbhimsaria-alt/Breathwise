/**
 * BreatheWise — /api/aqi routes
 *
 * GET /api/aqi/cities
 *     → Every Indian city that has CPCB monitoring stations, with a live
 *       city-level AQI (mean of station AQIs). Powers the city picker/search.
 *
 * GET /api/aqi/city?city=Delhi[&state=Delhi]
 *     → Stations for one city (plus a city-average entry) from CPCB, with
 *       OpenAQ as fallback.
 *
 * GET /api/aqi/nearby?lat=28.6&lon=77.2[&radius=50000]
 *     → Nearest CPCB stations to a coordinate, searched across ALL of India.
 *       OpenAQ is used only when no CPCB station is found in range.
 *
 * GET /api/aqi/station/:locationId   → One OpenAQ location's measurements.
 * GET /api/aqi/providers             → Which provider keys are configured.
 */

import { Router } from 'express';
import { fetchCpcbData, fetchAllCpcbRecords, groupByStation } from '../services/datagovService.js';
import { fetchNearbyLocations, fetchLocationMeasurements } from '../services/openaqService.js';
import { calculateAqi, normaliseId, calculateSubIndex } from '../utils/aqiCalculator.js';
import { evaluateFreshness, haversineKm } from '../utils/freshness.js';

const router = Router();

const CPCB_PROVIDER = 'CPCB via data.gov.in';
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

// Normalised-station memo, rebuilt only when the all-India snapshot changes.
let nsCache = { key: null, stations: [] };

async function getNormalisedStations() {
  const all = await fetchAllCpcbRecords();
  if (all.error) return { error: all.error, meta: all };
  if (nsCache.key !== all.fetchedAt) {
    nsCache = {
      key: all.fetchedAt,
      stations: groupByStation(all.records).map((st) => normaliseStation(st, CPCB_PROVIDER, all.attribution))
    };
  }
  return { stations: nsCache.stations, meta: all };
}

function mean(nums) {
  const v = nums.filter((n) => typeof n === 'number' && Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/**
 * City-level reading = mean of the real-time AQI of the city's usable stations.
 * Returns null when no station has a computable AQI.
 */
function buildCityAggregate(cityName, stateName, stations, attribution) {
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

  return {
    station: `${cityName} city average (${withAqi.length} station${withAqi.length === 1 ? '' : 's'})`,
    stationId: `cpcb-city-${slug(`${stateName || ''} ${cityName}`)}`,
    city: cityName,
    state: stateName || null,
    coordinates: centroid,
    distanceKm: null,

    aqi,
    aqiLabel: `Mean of real-time AQI across ${withAqi.length} CPCB station${withAqi.length === 1 ? '' : 's'}`,
    aqiCategory: getCpcbCategory(aqi),
    dominantPollutant,
    subIndices: null,
    pollutantCount: Object.values(pollutants).filter((v) => v !== null).length,
    averagingPeriodNote: AVERAGING_NOTE,

    pollutants,
    pollutantUnits: units,

    provider: CPCB_PROVIDER,
    isCpcbSource: true,
    attribution: attribution || null,

    measurementTimestamp: freshest?.measurementTimestamp || null,
    freshness: freshest?.freshness || null,
    dataType: 'live_measurement',
    isCityAggregate: true,
    stationCount: stations.length,
    stationsWithAqi: withAqi.length
  };
}

// ── GET /api/aqi/cities ──────────────────────────────────────
let citiesCache = { key: null, payload: null };

router.get('/cities', async (_req, res) => {
  const { stations, meta, error } = await getNormalisedStations();
  if (error) {
    return res.status(502).json({ dataType: 'unavailable', error, provider: 'data.gov.in' });
  }

  if (citiesCache.key !== meta.fetchedAt) {
    const groups = new Map();
    for (const st of stations) {
      if (!st.city) continue;
      const key = `${norm(st.state)}|${norm(st.city)}`;
      if (!groups.has(key)) groups.set(key, { city: st.city, state: st.state, stations: [] });
      groups.get(key).stations.push(st);
    }

    const cities = [];
    for (const g of groups.values()) {
      const agg = buildCityAggregate(g.city, g.state, g.stations, meta.attribution);
      cities.push({
        id: slug(`${g.state || ''} ${g.city}`),
        city: g.city,
        state: g.state,
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
    citiesCache = { key: meta.fetchedAt, payload: cities };
  }

  return res.json({
    dataType: 'live_measurements',
    provider: CPCB_PROVIDER,
    license: meta.license,
    attribution: meta.attribution,
    cities: citiesCache.payload,
    total: citiesCache.payload.length,
    partial: meta.partial || false,
    fromCache: meta.fromCache || false,
    fromStaleCache: meta.fromStaleCache || false,
    fetchedAt: meta.fetchedAt
  });
});

// ── GET /api/aqi/city ────────────────────────────────────────
router.get('/city', async (req, res) => {
  const city = String(req.query.city || 'Delhi').trim();
  const state = req.query.state ? String(req.query.state).trim() : null;

  // 1. CPCB all-India snapshot, filtered to the requested city
  let cityStations = [];
  let cpcbMeta = null;
  let cpcbError = null;

  const snap = await getNormalisedStations();
  if (snap.error) {
    cpcbError = snap.error;
  } else {
    cpcbMeta = snap.meta;
    const wanted = norm(city);
    const wantedState = state ? norm(state) : null;
    const inState = (s) => !wantedState || norm(s.state) === wantedState;
    cityStations = snap.stations.filter((s) => norm(s.city) === wanted && inState(s));
    if (cityStations.length === 0) {
      cityStations = snap.stations.filter((s) => norm(s.city).includes(wanted) && inState(s));
    }
  }

  // 1b. Snapshot unavailable or city not in it: try the older single-city query
  if (cityStations.length === 0) {
    const direct = await fetchCpcbData(city);
    if (!direct.error && direct.records && direct.records.length > 0) {
      cityStations = groupByStation(direct.records).map((st) => normaliseStation(st, CPCB_PROVIDER, direct.attribution));
      cpcbMeta = direct;
      cpcbError = null;
    } else if (!cpcbError) {
      cpcbError = direct.error || `No CPCB stations found for "${city}"`;
    }
  }

  if (cityStations.length > 0) {
    const aggregate = buildCityAggregate(cityStations[0].city || city, state || cityStations[0].state, cityStations, cpcbMeta.attribution);
    const stations = aggregate ? [aggregate, ...cityStations] : cityStations;
    return res.json({
      dataType: 'live_measurements',
      primaryProvider: CPCB_PROVIDER,
      license: cpcbMeta.license,
      attribution: cpcbMeta.attribution,
      stations,
      stationCount: cityStations.length,
      fetchedAt: cpcbMeta.fetchedAt,
      fromCache: cpcbMeta.fromCache || false,
      fallbackUsed: false
    });
  }

  // 2. CPCB failed or empty: OpenAQ as secondary (coordinates from query, else Delhi)
  const lat = parseFloat(req.query.lat) || 28.6139;
  const lon = parseFloat(req.query.lon) || 77.2090;

  const oaq = await fetchNearbyLocations(lat, lon);

  if (oaq.error) {
    return res.json({
      dataType: 'unavailable',
      primaryProvider: null,
      stations: [],
      stationCount: 0,
      errors: { cpcb: cpcbError, openaq: oaq.error },
      message: 'Both CPCB and OpenAQ providers are currently unavailable. Use demonstration mode.',
      fetchedAt: new Date().toISOString()
    });
  }

  const detailedStations = [];
  for (const loc of (oaq.locations || []).slice(0, 5)) {
    const detail = await fetchLocationMeasurements(loc.id);
    if (!detail.error) detailedStations.push(normaliseOpenAqStation(detail, lat, lon));
  }

  return res.json({
    dataType: detailedStations.length > 0 ? 'live_measurements' : 'unavailable',
    primaryProvider: 'OpenAQ (secondary)',
    primaryProviderNote: 'CPCB data.gov.in had no usable data for this city; using OpenAQ as fallback.',
    cpcbError,
    stations: detailedStations,
    stationCount: detailedStations.length,
    fetchedAt: oaq.fetchedAt,
    fromCache: oaq.fromCache || false,
    fallbackUsed: true
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

  // 1. CPCB: nearest stations across ALL of India (no city guessing)
  let cpcbReason = null;
  const snap = await getNormalisedStations();
  if (snap.error) {
    cpcbReason = snap.error;
  } else {
    const nearby = snap.stations
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

    if (eligible.length > 0) {
      return res.json({
        dataType: 'live_measurements',
        provider: CPCB_PROVIDER,
        license: snap.meta.license,
        attribution: snap.meta.attribution,
        stations: eligible,
        stationCount: eligible.length,
        searchCoordinates: { lat, lon },
        radiusM: widened ? MAX_WIDEN_KM * 1000 : radiusM,
        widenedSearch: widened,
        fetchedAt: snap.meta.fetchedAt,
        fromCache: snap.meta.fromCache || false,
        fallbackUsed: false
      });
    }
    cpcbReason = `No CPCB station with data within ${explicitRadius ? radiusKm : MAX_WIDEN_KM} km`;
  }

  // 2. OpenAQ fallback — only when CPCB has nothing in range
  const oaq = await fetchNearbyLocations(lat, lon, { radiusM });

  if (oaq.error) {
    return res.status(502).json({
      error: 'Both CPCB and OpenAQ providers failed or returned no nearby stations.',
      providers: { cpcb: cpcbReason, openaq: oaq.error }
    });
  }

  const detailed = [];
  for (const loc of (oaq.locations || []).slice(0, 3)) {
    const detail = await fetchLocationMeasurements(loc.id);
    if (!detail.error) detailed.push(normaliseOpenAqStation(detail, lat, lon));
  }

  return res.json({
    dataType: detailed.length > 0 ? 'live_measurements' : 'unavailable',
    provider: 'OpenAQ',
    providerNote: `${cpcbReason}; using OpenAQ as fallback.`,
    stations: detailed,
    stationCount: detailed.length,
    searchCoordinates: { lat, lon },
    radiusM,
    fetchedAt: oaq.fetchedAt,
    fallbackUsed: true
  });
});

// ── GET /api/aqi/station/:locationId ─────────────────────────
router.get('/station/:locationId', async (req, res) => {
  const locationId = parseInt(req.params.locationId);
  if (!Number.isFinite(locationId)) {
    return res.status(400).json({ error: 'locationId must be a number.' });
  }

  const detail = await fetchLocationMeasurements(locationId);
  if (detail.error) {
    return res.status(502).json({ error: detail.error, provider: 'OpenAQ' });
  }

  return res.json({
    dataType: 'live_measurements',
    provider: 'OpenAQ',
    station: normaliseOpenAqStation(detail),
    fetchedAt: detail.fetchedAt
  });
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
    }
  });
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
