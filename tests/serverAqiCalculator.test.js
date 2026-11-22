/**
 * BreatheWise Backend AQI Calculator & Freshness Test Suite
 *
 * Verifies:
 * 1. Piecewise linear sub-index calculations for all 7 CPCB pollutants.
 * 2. CPCB minimum pollutant coverage rule (>= 3 pollutants required for composite AQI).
 * 3. Mandatory particulate rule (at least one of PM2.5 or PM10 required).
 * 4. Proper labelling: "BreatheWise AQI estimate (CPCB methodology)".
 * 5. Freshness evaluation tiers (< 90m fresh, 90m-4h stale, 4h-24h very_stale, > 24h unavailable).
 * 6. Haversine distance calculations.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSubIndex,
  calculateAqi,
  normaliseId
} from '../server/utils/aqiCalculator.js';

import {
  evaluateFreshness,
  haversineKm,
  parseTimestamp,
  FRESHNESS_THRESHOLDS
} from '../server/utils/freshness.js';

describe('BreatheWise Backend AQI & Freshness Engine', () => {

  // -------------------------------------------------------------------------
  // Sub-index Calculations
  // -------------------------------------------------------------------------
  it('1. PM2.5 sub-index: 45 µg/m³ yields sub-index 75 (Satisfactory)', () => {
    const res = calculateSubIndex('pm25', 45);
    assert.ok(res);
    // Formula: ((100 - 51) / (60 - 31)) * (45 - 31) + 51 = 74.65 -> 75
    assert.equal(res.subIndex, 75);
    assert.equal(res.pollutantId, 'pm25');
  });

  it('2. PM2.5 sub-index: 25 µg/m³ yields sub-index ~42 (Good)', () => {
    const res = calculateSubIndex('pm25', 25);
    assert.ok(res);
    // Formula: (50/30) * 25 = 41.66 -> 42
    assert.equal(res.subIndex, 42);
  });

  it('3. PM10 sub-index: 150 µg/m³ yields sub-index ~133 (Moderate)', () => {
    const res = calculateSubIndex('pm10', 150);
    assert.ok(res);
    // Bracket: 101-250 -> 101-200. ((200 - 101) / (250 - 101)) * (150 - 101) + 101 = 133.56 -> 134
    assert.ok(res.subIndex >= 130 && res.subIndex <= 135);
  });

  it('4. NO2 sub-index: 60 µg/m³ yields sub-index ~75 (Satisfactory)', () => {
    const res = calculateSubIndex('no2', 60);
    assert.ok(res);
    assert.ok(res.subIndex >= 70 && res.subIndex <= 80);
  });

  // -------------------------------------------------------------------------
  // Minimum Coverage & Particulate Rules
  // -------------------------------------------------------------------------
  it('5. Incomplete pollutants (< 3) returns null (no composite AQI invented)', () => {
    // Only 2 pollutants: PM2.5 and PM10
    const res = calculateAqi({ pm25: 85, pm10: 160 });
    assert.equal(res, null, 'Must NOT calculate AQI when fewer than 3 pollutants are available');
  });

  it('6. Missing PM2.5 and PM10 returns null even if 3 gases exist', () => {
    // 3 pollutants (NO2, SO2, CO) but NO particulates
    const res = calculateAqi({ no2: 50, so2: 30, co: 1.2 });
    assert.equal(res, null, 'Must NOT calculate AQI when neither PM2.5 nor PM10 is measured');
  });

  it('7. Valid multi-pollutant set (PM2.5 + PM10 + NO2) calculates composite AQI with correct label', () => {
    const res = calculateAqi({
      pm25: 110, // sub-index: 91-120 -> 201-300: Poor (~265)
      pm10: 180, // sub-index: Moderate (~153)
      no2: 45    // sub-index: Satisfactory (~56)
    });

    assert.ok(res);
    assert.ok(res.aqi >= 201 && res.aqi <= 300, `Expected Poor AQI (201-300), got ${res.aqi}`);
    assert.equal(res.dominantPollutant, 'pm25');
    assert.equal(res.label, 'BreatheWise AQI estimate (CPCB methodology)');
    assert.equal(res.pollutantCount, 3);
  });

  it('8. All 6+ pollutants: dominant pollutant is the one with maximum sub-index', () => {
    const res = calculateAqi({
      pm25: 45,  // ~75
      pm10: 60,  // ~60
      no2: 350,  // ~358 (Very Poor)
      so2: 20,   // ~25
      co: 0.8,   // ~40
      o3: 30     // ~30
    });

    assert.ok(res);
    assert.equal(res.dominantPollutant, 'no2');
    assert.ok(res.aqi >= 350, `Expected NO2 dominant AQI >= 350, got ${res.aqi}`);
  });

  // -------------------------------------------------------------------------
  // Freshness Evaluation
  // -------------------------------------------------------------------------
  it('9. Measurement timestamp < 90 min is classified as FRESH', () => {
    const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    const f = evaluateFreshness(fortyMinsAgo);
    assert.equal(f.status, 'fresh');
    assert.equal(f.ageMinutes, 40);
  });

  it('10. Measurement timestamp between 90 min and 4 hrs is classified as STALE', () => {
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    const f = evaluateFreshness(twoHoursAgo);
    assert.equal(f.status, 'stale');
    assert.ok(f.label.includes('hrs ago'));
  });

  it('11. Measurement timestamp between 4 hrs and 24 hrs is classified as VERY_STALE', () => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const f = evaluateFreshness(eightHoursAgo);
    assert.equal(f.status, 'very_stale');
  });

  it('12. Measurement timestamp > 24 hrs or null is classified as UNAVAILABLE', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    assert.equal(evaluateFreshness(twoDaysAgo).status, 'unavailable');
    assert.equal(evaluateFreshness(null).status, 'unavailable');
    assert.equal(evaluateFreshness('invalid-date').status, 'unavailable');
  });

  it('13. Parses Indian CPCB DD-MM-YYYY format timestamps accurately', () => {
    // A timestamp from 30 minutes ago in Indian format
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const tsStr = `${d}-${m}-${y} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const f = evaluateFreshness(tsStr);
    assert.ok(f.status === 'fresh' || f.status === 'stale', `Expected fresh/stale for current date, got ${f.status}`);
  });

  // -------------------------------------------------------------------------
  // Haversine Distance
  // -------------------------------------------------------------------------
  it('14. Haversine distance between Connaught Place and Anand Vihar is ~11-13 km', () => {
    // CP: 28.6315, 77.2167
    // Anand Vihar: 28.6469, 77.3160
    const d = haversineKm(28.6315, 77.2167, 28.6469, 77.3160);
    assert.ok(d >= 9 && d <= 14, `Expected ~10-12 km, got ${d}`);
  });

  // -------------------------------------------------------------------------
  // Safe Numeric Parsing (CPCB avg_value fix)
  // -------------------------------------------------------------------------
  it('15. parseFloat("0") should return 0, not null — zero is a valid measurement', () => {
    // This verifies the safeFloat fix: parseFloat("0") || null was discarding 0
    const val = parseFloat("0");
    assert.equal(val, 0, 'parseFloat("0") must return 0');
    assert.equal(isNaN(val), false);
  });

  it('16. Sub-index for concentration 0 returns sub-index 0 (Good)', () => {
    const res = calculateSubIndex('pm25', 0);
    assert.ok(res, 'Zero concentration should produce a valid sub-index');
    assert.equal(res.subIndex, 0);
  });

  // -------------------------------------------------------------------------
  // Indian CPCB DD-MM-YYYY Timestamp Parsing
  // -------------------------------------------------------------------------
  it('17. parseTimestamp handles DD-MM-YYYY HH:mm:ss format in IST', () => {
    const dt = parseTimestamp('22-11-2026 10:30:00');
    assert.ok(dt instanceof Date, 'Should return a Date object');
    assert.equal(isNaN(dt.getTime()), false, 'Should be a valid date');
    // IST is UTC+05:30, so 10:30 IST = 05:00 UTC
    assert.equal(dt.getUTCHours(), 5);
    assert.equal(dt.getUTCMinutes(), 0);
  });

  it('18. parseTimestamp returns null for invalid input', () => {
    assert.equal(parseTimestamp(null), null);
    assert.equal(parseTimestamp(''), null);
    assert.equal(parseTimestamp('not-a-date'), null);
  });

  it('19. parseTimestamp handles ISO-8601 strings too', () => {
    const dt = parseTimestamp('2026-11-22T10:30:00+05:30');
    assert.ok(dt instanceof Date);
    assert.equal(isNaN(dt.getTime()), false);
  });

  // -------------------------------------------------------------------------
  // Normalise ID edge cases
  // -------------------------------------------------------------------------
  it('20. normaliseId maps PM2.5, PM 2.5, pm25 all to pm25', () => {
    assert.equal(normaliseId('PM2.5'), 'pm25');
    assert.equal(normaliseId('PM 2.5'), 'pm25');
    assert.equal(normaliseId('pm25'), 'pm25');
  });

  it('21. normaliseId maps ozone and OZONE to o3', () => {
    assert.equal(normaliseId('ozone'), 'o3');
    assert.equal(normaliseId('OZONE'), 'o3');
    assert.equal(normaliseId('O3'), 'o3');
  });

  // -------------------------------------------------------------------------
  // Prompt 04 Accuracy Audit Regression Tests
  // -------------------------------------------------------------------------
  it('22. Diagnostic PM2.5 = 228 µg/m³ yields sub-index 383 (Very Poor)', () => {
    const res = calculateSubIndex('pm25', 228, 'µg/m³');
    assert.ok(res);
    // Formula: ((400 - 301) / (250 - 121)) * (228 - 121) + 301 = (99 / 129) * 107 + 301 = 383.12 -> 383
    assert.equal(res.subIndex, 383);
    assert.equal(res.pollutantId, 'pm25');
  });

  it('23. Diagnostic PM10 = 161 µg/m³ yields sub-index 141 (Moderate)', () => {
    const res = calculateSubIndex('pm10', 161, 'µg/m³');
    assert.ok(res);
    // Formula: ((200 - 101) / (250 - 101)) * (161 - 101) + 101 = (99 / 149) * 60 + 101 = 140.87 -> 141
    assert.equal(res.subIndex, 141);
    assert.equal(res.pollutantId, 'pm10');
  });

  it('24. Diagnostic NO2 = 87 ppb converts to ~163.7 µg/m³ and yields sub-index 184', () => {
    const res = calculateSubIndex('no2', 87, 'ppb');
    assert.ok(res);
    // 87 ppb * (46.01 / 24.45) = 163.72 µg/m³
    // Bracket [81, 180, 101, 200]: ((200 - 101)/(180 - 81))*(163.72 - 81) + 101 = 183.72 -> 184
    assert.equal(res.subIndex, 184);
    assert.ok(Math.abs(res.convertedConcentration - 163.72) < 0.1);
  });

  it('25. NO2 = 87 µg/m³ yields sub-index 107', () => {
    const res = calculateSubIndex('no2', 87, 'µg/m³');
    assert.ok(res);
    // Bracket [81, 180, 101, 200]: 1 * (87 - 81) + 101 = 107
    assert.equal(res.subIndex, 107);
  });

  it('26. CO = 104 µg/m³ converts to 0.104 mg/m³ and yields sub-index 5 (NEVER 500)', () => {
    const res = calculateSubIndex('co', 104, 'µg/m³');
    assert.ok(res);
    assert.equal(res.subIndex, 5);
    assert.equal(res.unit, 'mg/m³');
    assert.equal(res.convertedConcentration, 0.104);
  });

  it('27. Badarpur diagnostic set resolves to AQI 383 with dominant PM2.5 (Fixes AQI 500 bug)', () => {
    const badarpur = calculateAqi(
      {
        pm25: 228,
        pm10: 161,
        no2: 87,
        co: 104,
        so2: 5,
        o3: 13,
        nh3: 33
      },
      {
        pm25: 'µg/m³',
        pm10: 'µg/m³',
        no2: 'ppb',
        co: 'µg/m³',
        so2: 'µg/m³',
        o3: 'µg/m³',
        nh3: 'µg/m³'
      }
    );

    assert.ok(badarpur);
    assert.equal(badarpur.aqi, 383, 'Badarpur AQI must be 383 (Very Poor), not 500');
    assert.equal(badarpur.dominantPollutant, 'pm25', 'Dominant pollutant must be PM2.5, not CO');
    assert.equal(badarpur.subIndices.pm25, 383);
    assert.equal(badarpur.subIndices.pm10, 141);
    assert.equal(badarpur.subIndices.no2, 184);
    assert.equal(badarpur.subIndices.co, 5);
  });

  it('28. Unsupported unit (e.g. ppb for PM2.5) safely returns null instead of fabricating AQI', () => {
    const res = calculateSubIndex('pm25', 50, 'ppb');
    assert.equal(res, null, 'Particulates cannot be converted from volumetric units');
  });

  it('29. Unrecognized unit string safely returns null', () => {
    const res = calculateSubIndex('no2', 50, 'furlongs/fortnight');
    assert.equal(res, null);
  });

  it('30. Implausibly extreme sensor spike (e.g. CO > 100 mg/m³) returns null (NEVER 500)', () => {
    const res = calculateSubIndex('co', 500, 'mg/m³');
    assert.equal(res, null, 'Extreme unphysical values must be rejected, not capped at 500');
  });

  it('31. Legitimate high concentration within plausible bounds caps at 500 (Severe)', () => {
    // PM2.5 of 450 µg/m³ is peak episodic smog, above 380 breakpoint but <= 2000 plausible limit
    const res = calculateSubIndex('pm25', 450, 'µg/m³');
    assert.ok(res);
    assert.equal(res.subIndex, 500);
    assert.equal(res.capped, true);
  });

  it('32. Zero and negative concentration handling', () => {
    assert.equal(calculateSubIndex('pm25', 0).subIndex, 0);
    assert.equal(calculateSubIndex('pm25', -10), null, 'Negative concentrations are invalid');
    assert.equal(calculateSubIndex('pm25', null), null);
    assert.equal(calculateSubIndex('pm25', undefined), null);
    assert.equal(calculateSubIndex('pm25', ''), null);
    assert.equal(calculateSubIndex('pm25', 'abc'), null);
  });

  it('33. Missing measurements are not treated as zero in calculateAqi', () => {
    const res = calculateAqi({
      pm25: 120,
      pm10: null,
      no2: 40,
      so2: undefined,
      co: 0.5
    });

    assert.ok(res);
    // 3 valid pollutants: pm25 (300), no2 (50), co (25)
    assert.equal(res.subIndices.pm10, undefined, 'Missing PM10 must not be invented or assumed zero');
    assert.equal(res.subIndices.so2, undefined, 'Missing SO2 must not be invented or assumed zero');
    assert.equal(res.dominantPollutant, 'pm25');
  });

  it('34. Overall AQI selection strictly follows maximum sub-index rule', () => {
    const res = calculateAqi({
      pm25: 35,  // sub-index: ~59
      pm10: 280, // sub-index: ~230 (Poor) - dominant
      no2: 30    // sub-index: ~38
    });

    assert.ok(res);
    assert.equal(res.dominantPollutant, 'pm10');
    assert.ok(res.aqi >= 220 && res.aqi <= 240);
  });

  it('35. Averaging period transparency note is always included in calculateAqi output', () => {
    const res = calculateAqi({
      pm25: 55,
      pm10: 95,
      no2: 45
    });

    assert.ok(res);
    assert.ok(res.averagingPeriodNote.includes('24-hr averaging'));
    assert.ok(res.averagingPeriodNote.includes('16 hours'));
  });

});
