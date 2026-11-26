/**
 * BreatheWise — useLiveAqi Hook
 *
 * React hook that:
 *  1. Checks if the backend is reachable.
 *  2. Fetches live air quality data for the current city.
 *  3. Falls back to demonstration mode when the backend is offline.
 *  4. Never silently substitutes demo data for live data.
 *  5. Provides a clear dataMode state: 'live' | 'demo' | 'loading' | 'error'.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkBackendHealth,
  fetchAqiForCity,
  pickBestStation,
  stationToCityFormat
} from '../services/aqiApiClient.js';

// City name mapping for API queries (demo city id → real city name)
const CITY_QUERY_MAP = {
  'delhi':     'Delhi',
  'mumbai':    'Mumbai',
  'bengaluru': 'Bengaluru',
  'kolkata':   'Kolkata',
  'chennai':   'Chennai',
  'hyderabad': 'Hyderabad',
  'pune':      'Pune',
  'lucknow':   'Lucknow'
};

// Approximate coordinates for Indian demo cities (for OpenAQ nearby search)
const CITY_COORDS = {
  'delhi':     { lat: 28.6139, lon: 77.2090 },
  'mumbai':    { lat: 19.0760, lon: 72.8777 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'kolkata':   { lat: 22.5726, lon: 88.3639 },
  'chennai':   { lat: 13.0827, lon: 80.2707 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'pune':      { lat: 18.5204, lon: 73.8567 },
  'lucknow':   { lat: 26.8467, lon: 80.9462 }
};

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Auto-refresh every 10 minutes

/**
 * @param {Object} demoCity – The currently selected demo city object
 * @returns {{ liveCity, dataMode, backendStatus, lastFetchError, refreshLiveData }}
 */
export function useLiveAqi(demoCity) {
  const [dataMode, setDataMode]       = useState('loading');  // 'loading' | 'live' | 'demo' | 'error'
  const [backendStatus, setBackendStatus] = useState(null);
  const [liveCity, setLiveCity]       = useState(null);
  const [lastFetchError, setLastFetchError] = useState(null);
  const refreshTimerRef = useRef(null);

  const fetchLive = useCallback(async (cityObj) => {
    // 1. Health check runs alongside the data request for status display only.
    //    It no longer blocks live data (a missing /api/health route must not force demo mode).
    checkBackendHealth().then(setBackendStatus).catch(() => {});

    // 2. Determine query parameters
    const cityId = cityObj?.id || 'delhi';
    const isGeoStation = cityId.startsWith('geo-');

    // Cities picked from the live list carry their exact CPCB city + state
    const liveQuery = cityObj?.liveQuery || null;
    const cityName = liveQuery?.city
      || CITY_QUERY_MAP[cityId]
      || (cityObj?.name || 'Delhi');
    const coords = CITY_COORDS[cityId]
      || (isGeoStation && cityObj?.liveStationCoords
        ? { lat: cityObj.liveStationCoords.lat, lon: cityObj.liveStationCoords.lon }
        : null);

    // 3. Fetch real data
    // For geo stations that already have live data embedded, use them directly
    if (isGeoStation && cityObj?.isLiveData && cityObj?.aqi != null) {
      setLiveCity(cityObj);
      setDataMode('live');
      setLastFetchError(null);
      return;
    }

    const result = await fetchAqiForCity(cityName, {
      state: liveQuery?.state,
      lat: coords?.lat,
      lon: coords?.lon
    });

    if (result.error || result.dataType === 'unavailable') {
      setDataMode('demo');
      setLiveCity(null);
      const detail = result.errors ? ` (${[result.errors.cpcb, result.errors.openaq].filter(Boolean).join('; ')})` : '';
      setLastFetchError(`${result.error || result.message || 'No data available from providers.'}${detail}`);
      return;
    }

    // 4. Pick best station
    const best = pickBestStation(result);
    if (!best) {
      setDataMode('demo');
      setLiveCity(null);
      setLastFetchError('Live stations found but all data is too stale or incomplete.');
      return;
    }

    // 5. Convert to city format and check freshness
    const liveCityObj = stationToCityFormat(best, cityObj);

    // If the data is very stale, still show it but flag it
    if (best.freshness?.status === 'very_stale') {
      liveCityObj.dataType = 'stale_measurement';
    }

    setLiveCity(liveCityObj);
    setDataMode('live');
    setLastFetchError(null);
  }, []);

  // Initial fetch and re-fetch when city changes
  useEffect(() => {
    if (!demoCity) return;

    // Only attempt live fetch for Indian cities that have monitoring stations
    // Support: known city IDs from CITY_QUERY_MAP, geolocation-based stations (geo-*),
    // and cities explicitly marked as live data sources
    const cityId = demoCity.id || '';
    const isIndianCity = !!CITY_QUERY_MAP[cityId]
      || cityId.startsWith('geo-')
      || cityId.startsWith('live-')
      || demoCity.isLiveData === true;
    if (!isIndianCity) {
      setDataMode('demo');
      setLiveCity(null);
      setLastFetchError('Live data is available for Indian cities only. Showing demonstration data.');
      return;
    }

    setDataMode('loading');
    fetchLive(demoCity);

    // Set up auto-refresh
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => fetchLive(demoCity), REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [demoCity?.id, fetchLive]);

  const refreshLiveData = useCallback(() => {
    if (demoCity) {
      setDataMode('loading');
      fetchLive(demoCity);
    }
  }, [demoCity, fetchLive]);

  return {
    liveCity,
    dataMode,
    backendStatus,
    lastFetchError,
    refreshLiveData
  };
}
