/**
 * BreatheWise — Frontend Air Quality API Client
 *
 * Communicates with the backend proxy (/api/aqi/*) to fetch real
 * air-quality data. Never contacts external APIs directly (the
 * backend holds all credentials).
 *
 * When the backend is unreachable the client returns a clear
 * error so the app can show live data as unavailable.
 */

const SERVER_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
const API_BASE = `${SERVER_URL}/api/aqi`;

// Render free instances can take a while to wake up, so allow a generous timeout.
const REQUEST_TIMEOUT_MS = 45000;

async function fetchJson(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(timer);
  }
}

// Use the backend's own explanation (e.g. "No recent station within 100 km") when it sends one.
async function errorDetail(response) {
  try {
    const body = await response.json();
    const text = body?.error || body?.message;
    if (text) return text;
  } catch { /* body was not JSON */ }
  return `Backend returned HTTP ${response.status}`;
}

/**
 * Fetch air quality from OpenAQ CPCB-source locations only.
 *
 * @param {string} city – City name, e.g. "Delhi"
 * @param {Object} [opts]
 * @param {string} [opts.state] – Optional state, to tell apart same-named cities
 * @param {number} [opts.lat] – Optional latitude for the primary OpenAQ lookup
 * @param {number} [opts.lon] – Optional longitude for the primary OpenAQ lookup
 * @returns {Promise<Object>}
 */
export async function fetchAqiForCity(city, opts = {}) {
  try {
    const params = new URLSearchParams({ city });
    if (opts.state) params.set('state', opts.state);
    if (opts.lat) params.set('lat', opts.lat);
    if (opts.lon) params.set('lon', opts.lon);

    const response = await fetchJson(`${API_BASE}/city?${params.toString()}`);

    if (!response.ok) {
      return { error: await errorDetail(response), status: response.status, dataType: 'unavailable' };
    }

    return await response.json();
  } catch (err) {
    return {
      error: `Backend unreachable: ${err.message}`,
      dataType: 'unavailable',
      message: 'The backend server is not running. Start it and retry.'
    };
  }
}

/**
 * Fetch air quality for coordinates (uses OpenAQ nearby-station search).
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Object>}
 */
export async function fetchAqiNearby(lat, lon) {
  try {
    const response = await fetchJson(`${API_BASE}/nearby?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      return { error: await errorDetail(response), status: response.status, dataType: 'unavailable' };
    }

    return await response.json();
  } catch (err) {
    return { error: `Backend unreachable: ${err.message}`, dataType: 'unavailable' };
  }
}

export async function fetchWeather(lat, lon) {
  try {
    const response = await fetchJson(`${API_BASE}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, 12000);
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

export async function fetchApproximateIpLocation() {
  try {
    const response = await fetchJson(`${API_BASE}/ip-location`, 7000);
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

export async function searchIndianPlaces(query) {
  try {
    const response=await fetchJson(`${API_BASE}/geocode?name=${encodeURIComponent(query)}`,10000);
    if(!response.ok) return [];
    const body=await response.json();
    return Array.isArray(body.results)?body.results:[];
  } catch { return []; }
}

let cityListCache = null; // { at, data }
const CITY_LIST_TTL_MS = 10 * 60 * 1000;

/**
 * Fetch every Indian city that has CPCB monitoring stations, with live AQI.
 * Cached in memory for 10 minutes so reopening the picker is instant.
 *
 * @returns {Promise<{ cities: Array, fetchedAt?: string, error?: string }>}
 */
export async function fetchCityList() {
  if (cityListCache && Date.now() - cityListCache.at < CITY_LIST_TTL_MS) {
    return cityListCache.data;
  }
  try {
    const response = await fetchJson(`${API_BASE}/cities`);
    if (!response.ok) {
      // The backend explains why in its JSON body (for example, an OpenAQ timeout).
      let detail = '';
      try {
        const body = await response.json();
        if (body && body.error) detail = `: ${body.error}`;
      } catch { /* body was not JSON, e.g. a gateway error page */ }
      return { cities: [], error: `Backend returned HTTP ${response.status}${detail}` };
    }
    const json = await response.json();
    if (!Array.isArray(json.cities)) {
      return { cities: [], error: json.error || 'Unexpected response from backend' };
    }
    cityListCache = { at: Date.now(), data: json };
    return json;
  } catch (err) {
    return {
      cities: [],
      error: err.name === 'AbortError' ? 'Backend took too long to respond' : `Backend unreachable: ${err.message}`
    };
  }
}

/**
 * Check which providers are configured on the backend.
 *
 * @returns {Promise<Object>}
 */
export async function fetchProviderStatus() {
  try {
    const response = await fetch(`${API_BASE}/providers`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return { error: 'Backend unavailable' };
    return await response.json();
  } catch {
    return { error: 'Backend unreachable' };
  }
}

/**
 * Check backend health.
 *
 * @returns {Promise<Object>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetchJson(`${SERVER_URL}/api/health`, 15000);
    if (!response.ok) return { status: 'error', reachable: false };
    const data = await response.json();
    return { ...data, reachable: true };
  } catch {
    return { status: 'offline', reachable: false };
  }
}

/**
 * Select the best station from an API response for use in the dashboard.
 * Prefers: closest station with the most pollutants measured.
 *
 * @param {Object} apiResponse – Response from fetchAqiForCity or fetchAqiNearby
 * @returns {Object|null} – A single normalised station object, or null
 */
export function pickBestStation(apiResponse) {
  if (!apiResponse || apiResponse.dataType === 'unavailable' || !apiResponse.stations) {
    return null;
  }

  // Filter stations with usable freshness
  const stations = apiResponse.stations.filter(
    s => s.freshness && s.freshness.status !== 'unavailable'
  );

  if (stations.length === 0) return null;

  // City-level selection (no user coordinates): use the city-average entry when it has an AQI
  const hasDistance = stations.some(s => s.distanceKm !== null && s.distanceKm !== undefined);
  if (!hasDistance) {
    const aggregate = stations.find(s => s.isCityAggregate && s.aqi !== null && s.aqi !== undefined);
    if (aggregate) return aggregate;
  }

  // Nearest known station wins; AQI coverage and freshness break distance ties.
  stations.sort((a, b) => {
    const aDistance = Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity;
    const bDistance = Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity;
    if (aDistance !== bDistance) return aDistance - bDistance;

    if ((a.aqi != null) !== (b.aqi != null)) return a.aqi != null ? -1 : 1;
    const countDiff = (b.pollutantCount || 0) - (a.pollutantCount || 0);
    if (countDiff !== 0) return countDiff;
    return (a.freshness?.ageMinutes ?? Infinity) - (b.freshness?.ageMinutes ?? Infinity);
  });

  return stations[0];
}

/**
 * Convert a live station object into the shape that existing
 * BreatheWise components (Dashboard, DailyRoutine, etc.) expect.
 *
 * This bridges the new normalised format with the old `currentCity`
 * object structure used throughout the app.
 *
 * @param {Object} station – From pickBestStation()
 * @param {Object} baseCity – The demo city object for city metadata
 * @returns {Object} – City-shaped object compatible with existing components
 */
export function stationToCityFormat(station, baseCity) {
  if (!station) return null;

  return {
    ...baseCity,
    id: baseCity?.id || 'live',
    name: baseCity?.name || station.city || station.station,

    // Real data fields
    aqi:  station.aqi,                              // may be null
    pm25: station.pollutants?.pm25 ?? null,
    pm10: station.pollutants?.pm10 ?? null,
    no2:  station.pollutants?.no2  ?? null,
    o3:   station.pollutants?.o3   ?? null,
    so2:  station.pollutants?.so2  ?? null,
    co:   station.pollutants?.co   ?? null,
    nh3:  station.pollutants?.nh3  ?? null,

    // Units
    pollutantUnits: station.pollutantUnits || {},

    // Weather: only keep baseCity weather if baseCity is not a synthetic geo station
    temp: baseCity?.isLiveData ? (station.temp ?? null) : (baseCity?.temp ?? station.temp ?? null),
    humidity: baseCity?.isLiveData ? (station.humidity ?? null) : (baseCity?.humidity ?? station.humidity ?? null),

    // Metadata
    primaryPollutant: station.dominantPollutant
      ? station.dominantPollutant.toUpperCase().replace('PM25', 'PM2.5')
      : baseCity?.primaryPollutant || 'PM2.5',
    lastUpdated: station.freshness?.label || 'Unknown',
    dataSource:  station.provider || 'Live Data',
    dataType:    station.dataType || 'live_measurement',

    // Live data flags (used by components to show/hide banners)
    isLiveData:          true,
    liveStation:         station.station,
    liveStationCoords:   station.coordinates,
    liveDistanceKm:      station.distanceKm,
    liveQuery: baseCity?.liveQuery || null,
    locationSource: baseCity?.locationSource || 'manual',
    liveFreshness:       station.freshness,
    liveAqiLabel:        station.aqiLabel,
    liveAttribution:     station.attribution,
    liveIsCpcb:          station.isCpcbSource,
    liveMeasurementTime: station.measurementTimestamp,
    liveSubIndices:      station.subIndices || null,
    livePollutantCount:  station.pollutantCount,
    averagingPeriodNote: station.averagingPeriodNote || null
  };
}
