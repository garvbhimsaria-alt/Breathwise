/**
 * BreatheWise — /api/aqi routes
 *
 * GET /api/aqi/city?city=Delhi
 *     → Tries CPCB (data.gov.in) first, then OpenAQ as fallback.
 *       Returns normalised air-quality data for the frontend.
 *
 * GET /api/aqi/nearby?lat=28.6&lon=77.2
 *     → Uses OpenAQ to find nearby stations and returns the best match.
 *
 * GET /api/aqi/station/:locationId
 *     → Returns measurements from a specific OpenAQ location ID.
 *
 * GET /api/aqi/providers
 *     → Reports which provider keys are configured and reachable.
 */

import { Router } from 'express';
import { fetchCpcbData, groupByStation } from '../services/datagovService.js';
import { fetchNearbyLocations, fetchLocationMeasurements } from '../services/openaqService.js';
import { calculateAqi, normaliseId, calculateSubIndex } from '../utils/aqiCalculator.js';
import { evaluateFreshness, haversineKm } from '../utils/freshness.js';

const router = Router();

// ── GET /api/aqi/city ────────────────────────────────────────
router.get('/city', async (req, res) => {
  const city = req.query.city || 'Delhi';

  // 1. Try CPCB (data.gov.in) — primary provider
  const cpcb = await fetchCpcbData(city);

  if (!cpcb.error && cpcb.records && cpcb.records.length > 0) {
    const stations = groupByStation(cpcb.records);
    const normalised = stations.map(st => normaliseStation(st, 'CPCB via data.gov.in', cpcb.attribution));

    return res.json({
      dataType: 'live_measurements',
      primaryProvider: 'CPCB via data.gov.in',
      license: cpcb.license,
      attribution: cpcb.attribution,
      stations: normalised,
      stationCount: normalised.length,
      fetchedAt: cpcb.fetchedAt,
      fromCache: cpcb.fromCache || false,
      fallbackUsed: false
    });
  }

  // 2. CPCB failed or empty — try OpenAQ as secondary
  // Default to Delhi coordinates
  const lat = parseFloat(req.query.lat) || 28.6139;
  const lon = parseFloat(req.query.lon) || 77.2090;

  const oaq = await fetchNearbyLocations(lat, lon);

  if (oaq.error) {
    // Both providers failed
    return res.json({
      dataType: 'unavailable',
      primaryProvider: null,
      stations: [],
      stationCount: 0,
      errors: {
        cpcb: cpcb.error || null,
        openaq: oaq.error
      },
      message: 'Both CPCB and OpenAQ providers are currently unavailable. Use demonstration mode.',
      fetchedAt: new Date().toISOString()
    });
  }

  // Fetch detailed measurements for top stations
  const detailedStations = [];
  const topLocations = (oaq.locations || []).slice(0, 5);

  for (const loc of topLocations) {
    const detail = await fetchLocationMeasurements(loc.id);
    if (!detail.error) {
      detailedStations.push(normaliseOpenAqStation(detail, lat, lon));
    }
  }

  return res.json({
    dataType: detailedStations.length > 0 ? 'live_measurements' : 'unavailable',
    primaryProvider: 'OpenAQ (secondary)',
    primaryProviderNote: 'CPCB data.gov.in was unavailable; using OpenAQ as fallback.',
    cpcbError: cpcb.error || null,
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

  const radius = parseInt(req.query.radius) || 25000;

  // ── 1. Try CPCB (data.gov.in) first — primary provider ──
  // Infer city from coordinates (Indian metro cities)
  const inferredCity = inferCityFromCoords(lat, lon);

  if (inferredCity) {
    try {
      const cpcb = await fetchCpcbData(inferredCity, { limit: 500 });

      if (!cpcb.error && cpcb.records && cpcb.records.length > 0) {
        const stations = groupByStation(cpcb.records);

        // Calculate distance from user to each station and filter those with valid coords
        const withDistance = stations
          .filter(st => st.latitude != null && st.longitude != null)
          .map(st => ({
            ...normaliseStation(st, 'CPCB via data.gov.in', cpcb.attribution),
            distanceKm: Math.round(haversineKm(lat, lon, st.latitude, st.longitude) * 10) / 10
          }))
          .filter(st => st.distanceKm <= radius / 1000) // Within radius
          .sort((a, b) => a.distanceKm - b.distanceKm);

        // Pick top 5 nearest stations that have at least some pollutant data
        const eligible = withDistance
          .filter(st => Object.values(st.pollutants).some(v => v !== null))
          .slice(0, 5);

        if (eligible.length > 0) {
          return res.json({
            dataType: 'live_measurements',
            provider: 'CPCB via data.gov.in',
            license: cpcb.license,
            attribution: cpcb.attribution,
            stations: eligible,
            stationCount: eligible.length,
            searchCoordinates: { lat, lon },
            radiusM: radius,
            inferredCity,
            fetchedAt: cpcb.fetchedAt,
            fromCache: cpcb.fromCache || false,
            fallbackUsed: false
          });
        }
      }
    } catch (err) {
      // CPCB failed, fall through to OpenAQ
    }
  }

  // ── 2. OpenAQ fallback — secondary provider ──
  const oaq = await fetchNearbyLocations(lat, lon, { radiusM: radius });

  if (oaq.error) {
    return res.status(502).json({
      error: 'Both CPCB and OpenAQ providers failed or returned no nearby stations.',
      providers: { cpcb: inferredCity ? 'No eligible stations' : 'City not inferred from coordinates', openaq: oaq.error }
    });
  }

  // Fetch detail for top 3 stations
  const detailed = [];
  for (const loc of (oaq.locations || []).slice(0, 3)) {
    const detail = await fetchLocationMeasurements(loc.id);
    if (!detail.error) {
      detailed.push(normaliseOpenAqStation(detail, lat, lon));
    }
  }

  return res.json({
    dataType: detailed.length > 0 ? 'live_measurements' : 'unavailable',
    provider: 'OpenAQ',
    providerNote: 'CPCB data.gov.in was unavailable or had no nearby stations; using OpenAQ as fallback.',
    stations: detailed,
    stationCount: detailed.length,
    searchCoordinates: { lat, lon },
    radiusM: radius,
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

/**
 * Infer the nearest Indian city from coordinates for CPCB query.
 * Returns the city name string or null if no city is close enough.
 */
const INDIAN_CITIES = [
  { name: 'Delhi',      lat: 28.6139, lon: 77.2090, radius: 60 },
  { name: 'Mumbai',     lat: 19.0760, lon: 72.8777, radius: 50 },
  { name: 'Bengaluru',  lat: 12.9716, lon: 77.5946, radius: 40 },
  { name: 'Kolkata',    lat: 22.5726, lon: 88.3639, radius: 40 },
  { name: 'Chennai',    lat: 13.0827, lon: 80.2707, radius: 40 },
  { name: 'Hyderabad',  lat: 17.3850, lon: 78.4867, radius: 40 },
  { name: 'Pune',       lat: 18.5204, lon: 73.8567, radius: 40 },
  { name: 'Lucknow',    lat: 26.8467, lon: 80.9462, radius: 40 },
  { name: 'Noida',      lat: 28.5355, lon: 77.3910, radius: 30 },
  { name: 'Gurugram',   lat: 28.4595, lon: 77.0266, radius: 30 },
  { name: 'Ghaziabad',  lat: 28.6692, lon: 77.4538, radius: 30 },
  { name: 'Faridabad',  lat: 28.4089, lon: 77.3178, radius: 30 }
];

function inferCityFromCoords(lat, lon) {
  let best = null;
  let bestDist = Infinity;

  for (const city of INDIAN_CITIES) {
    const d = haversineKm(lat, lon, city.lat, city.lon);
    if (d <= city.radius && d < bestDist) {
      best = city;
      bestDist = d;
    }
  }

  // NCR cities should map to "Delhi" for CPCB query since CPCB lists them under Delhi
  if (best && ['Noida', 'Gurugram', 'Ghaziabad', 'Faridabad'].includes(best.name)) {
    return 'Delhi';
  }

  return best ? best.name : null;
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
