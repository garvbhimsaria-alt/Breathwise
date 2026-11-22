/**
 * BreatheWise — Frontend Air Quality API Client
 *
 * Communicates with the backend proxy (/api/aqi/*) to fetch real
 * air-quality data. Never contacts external APIs directly (the
 * backend holds all credentials).
 *
 * When the backend is unreachable the client returns a clear
 * error so the app can fall back to demonstration mode.
 */

const SERVER_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
const API_BASE = `${SERVER_URL}/api/aqi`;

/**
 * Fetch air quality for a city name (primarily CPCB, with OpenAQ fallback).
 *
 * @param {string} city – City name, e.g. "Delhi"
 * @param {Object} [opts]
 * @param {number} [opts.lat] – Optional latitude for OpenAQ fallback
 * @param {number} [opts.lon] – Optional longitude for OpenAQ fallback
 * @returns {Promise<Object>}
 */
export async function fetchAqiForCity(city, opts = {}) {
  try {
    const params = new URLSearchParams({ city });
    if (opts.lat) params.set('lat', opts.lat);
    if (opts.lon) params.set('lon', opts.lon);

    const response = await fetch(`${API_BASE}/city?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return { error: `Backend returned HTTP ${response.status}`, dataType: 'unavailable' };
    }

    return await response.json();
  } catch (err) {
    return {
      error: `Backend unreachable: ${err.message}`,
      dataType: 'unavailable',
      message: 'The backend server is not running. Using demonstration mode.'
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
    const response = await fetch(`${API_BASE}/nearby?lat=${lat}&lon=${lon}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return { error: `Backend returned HTTP ${response.status}`, dataType: 'unavailable' };
    }

    return await response.json();
  } catch (err) {
    return { error: `Backend unreachable: ${err.message}`, dataType: 'unavailable' };
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
    const response = await fetch(`${SERVER_URL}/api/health`, {
      headers: { 'Accept': 'application/json' }
    });
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

  const stations = apiResponse.stations.filter(
    s => s.freshness && s.freshness.status !== 'unavailable'
  );

  if (stations.length === 0) return null;

  // Sort: prefer more pollutants, then closer distance, then fresher
  stations.sort((a, b) => {
    // Prefer stations with computed AQI
    if (a.aqi !== null && b.aqi === null) return -1;
    if (a.aqi === null && b.aqi !== null) return 1;

    // Then by pollutant count (more is better)
    const countDiff = (b.pollutantCount || 0) - (a.pollutantCount || 0);
    if (countDiff !== 0) return countDiff;

    // Then by distance (closer is better)
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }

    // Then by freshness (fresher is better)
    return (a.freshness?.ageMinutes ?? 999) - (b.freshness?.ageMinutes ?? 999);
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
    temp: (baseCity && baseCity.temp !== undefined && !baseCity.id?.startsWith('geo-'))
      ? baseCity.temp
      : (station.temp ?? null),
    humidity: (baseCity && baseCity.humidity !== undefined && !baseCity.id?.startsWith('geo-'))
      ? baseCity.humidity
      : (station.humidity ?? null),

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
