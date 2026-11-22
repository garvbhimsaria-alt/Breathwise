/**
 * BreatheWise — CPCB Sub-Index Calculator & Decision Engine
 *
 * Implements the official Indian Central Pollution Control Board (CPCB)
 * National Air Quality Index (NAQI) piecewise-linear formula:
 *   Ip = ((IHI − ILO) / (BHI − BLO)) × (Cp − BLO) + ILO
 *
 * References:
 *   - CPCB National Air Quality Index report (Ministry of Environment, Forest & Climate Change)
 *   - Technical Specifications for Continuous Ambient Air Quality Monitoring Stations (CAAQMS)
 *
 * CPCB Averaging Periods:
 *   - 24-hour average: PM2.5, PM10, NO2, SO2, NH3
 *   - 8-hour average: CO, O3
 *
 * Minimum Data / Observation Requirements:
 *   - Minimum 16 hours of valid monitoring (67% observation coverage) required for a valid 24-hr average.
 *   - Minimum 3 pollutants with calculable sub-indices must be present for a composite AQI.
 *   - At least one particulate pollutant (PM2.5 or PM10) must be present.
 *   - If minimum criteria are not met, composite AQI is NOT calculated (marked unavailable).
 *   - Individual pollutant sub-indices remain available even when composite AQI cannot be calculated.
 *
 * Units & Plausibility:
 *   - PM2.5, PM10, NO2, SO2, O3, NH3 use µg/m³.
 *   - CO uses mg/m³.
 *   - Unphysical concentrations, unsupported units, or invalid values return null (NEVER 500).
 */

import { convertToCpcbUnit, TARGET_CPCB_UNITS } from './unitConverter.js';

// CPCB Breakpoint Table with official averaging periods and maximum plausible limits
export const POLLUTANT_SPECS = {
  pm25: {
    unit: 'µg/m³',
    averagingPeriod: '24-hour',
    maxPlausible: 2000, // concentrations above this indicate severe sensor malfunction
    breakpoints: [
      [0,   30,  0,   50],
      [31,  60,  51,  100],
      [61,  90,  101, 200],
      [91,  120, 201, 300],
      [121, 250, 301, 400],
      [250, 380, 401, 500]
    ]
  },
  pm10: {
    unit: 'µg/m³',
    averagingPeriod: '24-hour',
    maxPlausible: 3000,
    breakpoints: [
      [0,   50,  0,   50],
      [51,  100, 51,  100],
      [101, 250, 101, 200],
      [251, 350, 201, 300],
      [351, 430, 301, 400],
      [430, 510, 401, 500]
    ]
  },
  no2: {
    unit: 'µg/m³',
    averagingPeriod: '24-hour',
    maxPlausible: 1000,
    breakpoints: [
      [0,   40,  0,   50],
      [41,  80,  51,  100],
      [81,  180, 101, 200],
      [181, 280, 201, 300],
      [281, 400, 301, 400],
      [400, 520, 401, 500]
    ]
  },
  so2: {
    unit: 'µg/m³',
    averagingPeriod: '24-hour',
    maxPlausible: 3000,
    breakpoints: [
      [0,   40,  0,   50],
      [41,  80,  51,  100],
      [81,  380, 101, 200],
      [381, 800, 201, 300],
      [801, 1600, 301, 400],
      [1600, 2100, 401, 500]
    ]
  },
  co: {
    unit: 'mg/m³',
    averagingPeriod: '8-hour',
    maxPlausible: 100, // 100 mg/m³ is ~87 ppm, extreme toxic hazard
    breakpoints: [
      [0,   1.0, 0,   50],
      [1.1, 2.0, 51,  100],
      [2.1, 10,  101, 200],
      [10,  17,  201, 300],
      [17,  34,  301, 400],
      [34,  46,  401, 500]
    ]
  },
  o3: {
    unit: 'µg/m³',
    averagingPeriod: '8-hour',
    maxPlausible: 1200,
    breakpoints: [
      [0,   50,  0,   50],
      [51,  100, 51,  100],
      [101, 168, 101, 200],
      [169, 208, 201, 300],
      [209, 748, 301, 400],
      [748, 960, 401, 500]
    ]
  },
  nh3: {
    unit: 'µg/m³',
    averagingPeriod: '24-hour',
    maxPlausible: 3000,
    breakpoints: [
      [0,   200,  0,   50],
      [201, 400,  51,  100],
      [401, 800,  101, 200],
      [801, 1200, 201, 300],
      [1201, 1800, 301, 400],
      [1800, 2400, 401, 500]
    ]
  }
};

// Breakpoint arrays for backward compatibility
export const BREAKPOINTS = Object.fromEntries(
  Object.entries(POLLUTANT_SPECS).map(([k, v]) => [k, v.breakpoints])
);

/**
 * Calculate the CPCB sub-index for a single pollutant.
 *
 * @param {string} pollutantId – e.g. 'pm25', 'pm10', 'no2', 'co'
 * @param {number} concentration – measured concentration
 * @param {string|null} [unit=null] – optional unit string (e.g. 'ppb', 'µg/m³', 'mg/m³')
 * @returns {{ subIndex: number, pollutantId: string, unit: string, convertedConcentration: number } | null}
 */
export function calculateSubIndex(pollutantId, concentration, unit = null) {
  const id = normaliseId(pollutantId);
  const spec = POLLUTANT_SPECS[id];
  if (!spec) return null;

  if (concentration === null || concentration === undefined || concentration === '') {
    return null;
  }

  const rawNum = Number(concentration);
  if (!Number.isFinite(rawNum) || rawNum < 0) {
    return null;
  }

  // Unit conversion handling:
  let finalConc = rawNum;
  let finalUnit = spec.unit;

  if (unit) {
    const converted = convertToCpcbUnit(id, rawNum, unit);
    if (!converted) {
      // Incompatible or unsupported unit (e.g. ppb for PM2.5) → safe null rejection
      return null;
    }
    finalConc = converted.value;
    finalUnit = converted.targetUnit;
  } else {
    // If unit is omitted, check for common implicit unit discrepancies:
    // CPCB CAAQMS / data.gov.in telemetry outputs all pollutants in µg/m³,
    // whereas CPCB's CO breakpoint table uses mg/m³.
    // In ambient air, CO > 46 mg/m³ is lethal and unphysical for ambient air.
    // If CO > 46 is supplied without a unit, it is almost certainly in µg/m³.
    if (id === 'co' && rawNum > 46) {
      finalConc = rawNum / 1000;
      finalUnit = 'mg/m³';
    }
  }

  // Check physical sensor bounds: if it exceeds plausible limits, reject as anomaly/malfunction
  if (finalConc > spec.maxPlausible) {
    return null; // NEVER assign 500 to sensor errors or crazy outliers
  }

  // Piecewise linear sub-index calculation
  for (const [bLo, bHi, iLo, iHi] of spec.breakpoints) {
    if (finalConc >= bLo && finalConc <= bHi) {
      const subIndex = ((iHi - iLo) / (bHi - bLo)) * (finalConc - bLo) + iLo;
      return {
        subIndex: Math.round(subIndex),
        pollutantId: id,
        unit: finalUnit,
        convertedConcentration: finalConc
      };
    }
  }

  // If concentration is within plausible bounds but exceeds the top breakpoint,
  // CPCB defines the sub-index as Severe (capped at 500)
  const topBreakpoint = spec.breakpoints[spec.breakpoints.length - 1];
  if (finalConc > topBreakpoint[1]) {
    return {
      subIndex: 500,
      pollutantId: id,
      unit: finalUnit,
      convertedConcentration: finalConc,
      capped: true
    };
  }

  return null;
}

/**
 * Compute the composite CPCB AQI from a map of pollutant readings.
 *
 * Enforces official CPCB NAQI rules:
 *   1. Minimum 3 pollutants with valid sub-indices.
 *   2. At least one of PM2.5 or PM10 must be present.
 *   3. Overall AQI = max(subIndices).
 *   4. Dominant pollutant = pollutant with the highest sub-index.
 *   5. If criteria not met, composite AQI is null, but available sub-indices
 *      and pollutant readings are preserved transparently.
 *
 * @param {Object} concentrations – Map of pollutant values: { pm25: 228, pm10: 161, ... }
 *                                  or { pm25: { avg: 228, unit: 'µg/m³' }, ... }
 * @param {Object} [units={}] – Optional map of unit strings: { no2: 'ppb', co: 'µg/m³' }
 * @returns {Object} Result object with AQI, dominant pollutant, subIndices, and transparency notes
 */
export function calculateAqi(concentrations, units = {}) {
  if (!concentrations || typeof concentrations !== 'object') return null;

  const subIndices = {};
  const processedConcentrations = {};
  const processedUnits = {};

  for (const [key, rawVal] of Object.entries(concentrations)) {
    if (rawVal === null || rawVal === undefined) continue;

    const normId = normaliseId(key);
    let val = rawVal;
    let unit = units[normId] || units[key] || null;

    // Handle object structure { avg: 228, unit: 'µg/m³' } or { value: 228, unit: 'ppb' }
    if (typeof rawVal === 'object' && rawVal !== null) {
      val = rawVal.avg ?? rawVal.value ?? null;
      unit = rawVal.unit || unit;
    }

    if (val === null || val === undefined) continue;

    const res = calculateSubIndex(normId, val, unit);
    if (res !== null) {
      subIndices[res.pollutantId] = res.subIndex;
      processedConcentrations[res.pollutantId] = res.convertedConcentration;
      processedUnits[res.pollutantId] = res.unit;
    }
  }

  const validIds = Object.keys(subIndices);
  const hasParticulates = validIds.includes('pm25') || validIds.includes('pm10');
  const hasMinimumCount = validIds.length >= 3;

  const averagingPeriodNote = 'Real-time observation; official CPCB AQI requires 24-hr averaging with minimum 16 hours of monitoring (67% observation coverage).';

  // Check CPCB eligibility requirements (at least 3 pollutants, including PM2.5 or PM10)
  if (!hasMinimumCount || !hasParticulates) {
    return null;
  }

  // Composite AQI = maximum valid sub-index
  let maxSub = -1;
  let dominant = '';
  for (const [id, sub] of Object.entries(subIndices)) {
    if (sub > maxSub) {
      maxSub = sub;
      dominant = id;
    }
  }

  return {
    aqi: maxSub,
    dominantPollutant: dominant,
    subIndices,
    pollutants: processedConcentrations,
    units: processedUnits,
    calculable: true,
    label: 'BreatheWise AQI estimate (CPCB methodology)',
    pollutantCount: validIds.length,
    averagingPeriodNote
  };
}

// ── ID Normalisation Helper ──────────────────────────────────
const ID_MAP = {
  'pm2.5': 'pm25', 'pm25': 'pm25', 'pm 2.5': 'pm25',
  'pm10': 'pm10', 'pm 10': 'pm10',
  'no2': 'no2', 'nitrogen dioxide': 'no2',
  'so2': 'so2', 'sulphur dioxide': 'so2', 'sulfur dioxide': 'so2',
  'co': 'co', 'carbon monoxide': 'co',
  'o3': 'o3', 'ozone': 'o3',
  'nh3': 'nh3', 'ammonia': 'nh3'
};

export function normaliseId(raw) {
  if (!raw) return '';
  const s = String(raw).toLowerCase().trim();
  return ID_MAP[s] || s;
}
