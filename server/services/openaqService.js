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
const CACHE_TTL_MS = 90 * 1000; // keep latest readings within the requested 60–120 second window

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
  const cacheKey = `oaq_loc_${lat.toFixed(4)}_${lon.toFixed(4)}_${radius}`;

  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return { ...cached.data, fromCache: true };
  }

  const url = `${BASE}/locations?coordinates=${lat},${lon}&radius=${radius}&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
      provider:    loc.provider?.name || loc.providers?.[0]?.name || loc.owner?.name || 'Unknown',
      isCpcb:      isCpcbSource(loc),
      locality:    loc.locality || null,
      state:       loc.state || loc.adminRegion || null,
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

let indiaLocationsCache = null;
const INDIA_LOCATIONS_TTL_MS = 30 * 60 * 1000;
const INDIA_LOCATIONS_PAGE_LIMIT = 100;
const INDIA_LOCATIONS_MAX_PAGES = 25;

/** Fetch India's OpenAQ location inventory for the live city picker. */
export async function fetchIndianLocations() {
  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) return { error: 'OPENAQ_API_KEY is not configured', provider: 'OpenAQ' };
  if (indiaLocationsCache && Date.now() - indiaLocationsCache.fetchedAt < INDIA_LOCATIONS_TTL_MS) {
    return { ...indiaLocationsCache.data, fromCache: true };
  }

  const locations = [];
  let found = 0;
  const headers = { Accept: 'application/json', 'X-API-Key': apiKey };
  try {
    for (let page = 1; page <= INDIA_LOCATIONS_MAX_PAGES; page += 1) {
      const url = `${BASE}/locations?iso=IN&limit=${INDIA_LOCATIONS_PAGE_LIMIT}&page=${page}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(url, { signal: controller.signal, headers });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        return { error: `OpenAQ locations returned HTTP ${response.status}`, provider: 'OpenAQ' };
      }
      const json = await response.json();
      const pageLocations = Array.isArray(json.results) ? json.results : [];
      found = Number(json.meta?.found) || locations.length + pageLocations.length;
      locations.push(...pageLocations);
      if (pageLocations.length < INDIA_LOCATIONS_PAGE_LIMIT || locations.length >= found) break;
    }

    const result = {
      locations,
      total: found,
      partial: locations.length < found,
      provider: 'OpenAQ',
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };
    indiaLocationsCache = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err) {
    return {
      error: err.name === 'AbortError' ? 'OpenAQ city inventory request timed out' : `OpenAQ city inventory fetch failed: ${err.message}`,
      provider: 'OpenAQ'
    };
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
  if (!apiKey) return { error: 'OPENAQ_API_KEY is not configured', provider: 'OpenAQ' };

  const cacheKey = 'oaq_meas_' + locationId;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < 90 * 1000) {
    return { ...cached.data, fromCache: true };
  }

  const headers = { Accept: 'application/json', 'X-API-Key': apiKey };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const [locResp, latestResp] = await Promise.all([
      fetch(BASE + '/locations/' + locationId, { signal: controller.signal, headers }),
      fetch(BASE + '/locations/' + locationId + '/latest', { signal: controller.signal, headers })
    ]);

    if (!locResp.ok) {
      return { error: 'OpenAQ location returned HTTP ' + locResp.status, status: locResp.status, provider: 'OpenAQ' };
    }
    if (!latestResp.ok) {
      return { error: 'OpenAQ latest returned HTTP ' + latestResp.status, status: latestResp.status, provider: 'OpenAQ' };
    }

    const [locJson, latestJson] = await Promise.all([locResp.json(), latestResp.json()]);
    const loc = locJson.results?.[0] || locJson;
    let measurements = Array.isArray(latestJson.results) ? latestJson.results : [];
    if (measurements.length === 1 && Array.isArray(measurements[0].measurements)) {
      measurements = measurements[0].measurements;
    }

    const readingsBySensor = new Map();
    for (const reading of measurements) {
      const sensorId = reading.sensorsId ?? reading.sensorId;
      if (sensorId == null) continue;
      readingsBySensor.set(String(sensorId), {
        value: reading.value,
        timestamp: reading.datetime?.utc || null
      });
    }

    const sensors = (loc.sensors || []).map(sensor => {
      const reading = readingsBySensor.get(String(sensor.id));
      return {
        id: sensor.id,
        parameter: sensor.parameter?.name || null,
        parameterId: sensor.parameter?.id || null,
        unit: sensor.parameter?.units || null,
        lastValue: reading?.value ?? null,
        lastUpdated: reading?.timestamp || null
      };
    });

    const pollutants = {};
    let latestTimestamp = null;
    for (const sensor of sensors) {
      if (sensor.lastValue == null || !sensor.parameter) continue;
      const normalized = normaliseParam(sensor.parameter);
      if (!normalized) continue;
      pollutants[normalized] = {
        value: sensor.lastValue,
        unit: sensor.unit,
        timestamp: sensor.lastUpdated
      };
      if (sensor.lastUpdated && (!latestTimestamp || new Date(sensor.lastUpdated) > new Date(latestTimestamp))) {
        latestTimestamp = sensor.lastUpdated;
      }
    }

    const result = {
      locationId: loc.id,
      name: loc.name || 'Unknown Station',
      coordinates: loc.coordinates
        ? { lat: loc.coordinates.latitude, lon: loc.coordinates.longitude }
        : null,
      country: loc.country?.code || null,
      locality: loc.locality || null,
      state: loc.state || loc.adminRegion || null,
      provider: loc.provider?.name || loc.providers?.[0]?.name || loc.owner?.name || 'Unknown',
      isCpcb: isCpcbSource(loc),
      pollutants,
      sensors,
      latestTimestamp,
      fetchedAt: new Date().toISOString(),
      fromCache: false
    };

    cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (err) {
    return {
      error: err.name === 'AbortError'
        ? 'OpenAQ request timed out (15s)'
        : 'OpenAQ fetch failed: ' + err.message,
      provider: 'OpenAQ'
    };
  } finally {
    clearTimeout(timeout);
  }
}
// ── Helpers ──────────────────────────────────────────────────

/**
 * Determine whether an OpenAQ location originates from a CPCB / government source.
 * This prevents non-CPCB data from being silently labelled as such.
 */
function isCpcbSource(location) {
  const providerName = (
    location.provider?.name ||
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
