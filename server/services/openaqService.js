/**
 * BreatheWise — OpenAQ v3 Provider Service
 *
 * Base URL: https://api.openaq.org/v3
 * Authentication: X-API-Key header (free registration required).
 * Rate limits: ~60 req/min, ~2000 req/hr (free tier).
 *
 * Important: OpenAQ is an aggregator. Not all data originates from CPCB.
 * We verify the provider/owner metadata for each location and tag it
 * so the frontend never silently treats non-CPCB data as CPCB.
 */

const BASE = 'https://api.openaq.org/v3';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Find monitoring locations near a coordinate.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {Object} [opts]
 * @param {number} [opts.radiusM=25000] – Search radius in metres
 * @param {number} [opts.limit=20]
 * @returns {Object}
 */
export async function fetchNearbyLocations(lat, lon, opts = {}) {
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    return { error: 'OPENAQ_API_KEY is not configured', provider: 'OpenAQ' };
  }

  const radius = opts.radiusM || 25000;
  const limit  = opts.limit   || 20;
  const cacheKey = `oaq_loc_${lat.toFixed(2)}_${lon.toFixed(2)}_${radius}`;

  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  const url = `${BASE}/locations?coordinates=${lat},${lon}&radius=${radius}&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        error: `OpenAQ returned HTTP ${response.status}`,
        status: response.status,
        provider: 'OpenAQ'
      };
    }

    const json = await response.json();
    const results = (json.results || []).map(loc => ({
      id:          loc.id,
      name:        loc.name || 'Unknown Station',
      coordinates: loc.coordinates ? { lat: loc.coordinates.latitude, lon: loc.coordinates.longitude } : null,
      country:     loc.country?.code || null,
      countryName: loc.country?.name || null,
      provider:    loc.providers?.[0]?.name || loc.owner?.name || 'Unknown',
      isCpcb:      isCpcbSource(loc),
      sensors:     (loc.sensors || []).map(s => ({
        id:          s.id,
        parameter:   s.parameter?.name || null,
        parameterId: s.parameter?.id || null,
        unit:        s.parameter?.units || null,
        lastValue:   s.latest?.value ?? null,
        lastUpdated: s.latest?.datetime?.utc || s.latest?.datetime || null
      })),
      lastUpdated: loc.datetimeLast?.utc || loc.datetimeLast || null
    }));

    const result = {
      locations: results,
      total: json.meta?.found || results.length,
      provider: 'OpenAQ',
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      return { error: 'OpenAQ request timed out (15s)', provider: 'OpenAQ' };
    }
    return { error: `OpenAQ fetch failed: ${err.message}`, provider: 'OpenAQ' };
  }
}

/**
 * Fetch latest sensor measurements for a specific location.
 *
 * @param {number} locationId – OpenAQ location ID
 * @returns {Object}
 */
export async function fetchLocationMeasurements(locationId) {
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    return { error: 'OPENAQ_API_KEY is not configured', provider: 'OpenAQ' };
  }

  const cacheKey = `oaq_meas_${locationId}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < (5 * 60 * 1000)) { // 5 min cache for measurements
    return { ...cached.data, fromCache: true };
  }

  const url = `${BASE}/locations/${locationId}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        error: `OpenAQ returned HTTP ${response.status}`,
        status: response.status,
        provider: 'OpenAQ'
      };
    }

    const json = await response.json();
    const loc = json.results?.[0] || json;

    const sensors = (loc.sensors || []).map(s => ({
      id:          s.id,
      parameter:   s.parameter?.name || null,
      parameterId: s.parameter?.id || null,
      unit:        s.parameter?.units || null,
      lastValue:   s.latest?.value ?? null,
      lastUpdated: s.latest?.datetime?.utc || s.latest?.datetime || null
    }));

    // Build pollutant concentration map
    const pollutants = {};
    let latestTimestamp = null;

    for (const s of sensors) {
      if (s.lastValue === null || s.parameter === null) continue;

      const normalised = normaliseParam(s.parameter);
      if (normalised) {
        pollutants[normalised] = {
          value: s.lastValue,
          unit:  s.unit,
          timestamp: s.lastUpdated
        };
        if (s.lastUpdated) {
          if (!latestTimestamp || new Date(s.lastUpdated) > new Date(latestTimestamp)) {
            latestTimestamp = s.lastUpdated;
          }
        }
      }
    }

    const result = {
      locationId: loc.id,
      name:        loc.name || 'Unknown Station',
      coordinates: loc.coordinates ? { lat: loc.coordinates.latitude, lon: loc.coordinates.longitude } : null,
      country:     loc.country?.code || null,
      provider:    loc.providers?.[0]?.name || loc.owner?.name || 'Unknown',
      isCpcb:      isCpcbSource(loc),
      pollutants,
      sensors,
      latestTimestamp,
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      return { error: 'OpenAQ request timed out (15s)', provider: 'OpenAQ' };
    }
    return { error: `OpenAQ fetch failed: ${err.message}`, provider: 'OpenAQ' };
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Determine whether an OpenAQ location originates from a CPCB / government source.
 * This prevents non-CPCB data from being silently labelled as such.
 */
function isCpcbSource(location) {
  const providerName = (
    location.providers?.[0]?.name ||
    location.owner?.name ||
    ''
  ).toLowerCase();

  return (
    providerName.includes('cpcb') ||
    providerName.includes('central pollution') ||
    providerName.includes('dpcc') ||
    providerName.includes('delhi pollution') ||
    providerName.includes('spcb') ||
    providerName.includes('government') ||
    providerName.includes('airnow')      // AirNow ingests from CPCB for some stations
  );
}

const PARAM_MAP = {
  'pm25': 'pm25', 'pm2.5': 'pm25',
  'pm10': 'pm10',
  'no2': 'no2', 'nitrogen dioxide': 'no2',
  'so2': 'so2', 'sulfur dioxide': 'so2', 'sulphur dioxide': 'so2',
  'co': 'co', 'carbon monoxide': 'co',
  'o3': 'o3', 'ozone': 'o3',
  'nh3': 'nh3', 'ammonia': 'nh3'
};

function normaliseParam(raw) {
  return PARAM_MAP[String(raw).toLowerCase().trim()] || null;
}
