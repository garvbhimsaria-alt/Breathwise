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
    if (!map[r.station]) {
      map[r.station] = {
        station: r.station,
        city: r.city,
        state: r.state,
        latitude: r.latitude,
        longitude: r.longitude,
        pollutants: {},
        lastUpdate: null
      };
    }
    const st = map[r.station];

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
