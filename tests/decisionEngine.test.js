/**
 * BreatheWise Decision Engine Test Suite
 * 
 * Tests all 10 required scenarios using Node.js native test runner (node:test).
 * Zero external dependencies, ultra-fast, and reproducible.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyAqi,
  CPCB_AQI_THRESHOLDS,
  generateRecommendations,
  generateDynamicRoutine,
  calculateCommuteImpact
} from '../src/engine/index.js';

describe('BreatheWise Decision Engine — Comprehensive Test Suite', () => {

  // -------------------------------------------------------------------------
  // TEST 1: Good AQI with an Outdoor Runner
  // -------------------------------------------------------------------------
  it('1. Good AQI with an outdoor runner allows outdoor activities with proper reasoning', () => {
    const profile = {
      name: 'Rohan',
      lifestyle: 'working_professional',
      exerciseHabit: 'morning_runner',
      commuteType: 'metro',
      hasAirPurifier: true
    };

    const recs = generateRecommendations(35, profile);
    const routine = generateDynamicRoutine(profile, 35);

    // Verify AQI Classification
    assert.equal(recs.aqiResult.valid, true);
    assert.equal(recs.aqiResult.category, 'Good');
    assert.equal(recs.aqiResult.outdoorSafe, true);

    // Verify Exercise Recommendation
    const exerciseRec = recs.recommendationsByDomain['exercise'];
    assert.ok(exerciseRec.action.toLowerCase().includes('outdoor'));
    assert.ok(exerciseRec.reason.toLowerCase().includes('clean'));

    // Verify Routine Step 1
    const step1 = routine[0];
    assert.ok(step1.title.includes('Outdoor'));
    assert.equal(step1.badgeType, 'success');
    assert.ok(step1.recommendedAction.includes('Take full advantage'));

    // Verify all routine step timestamps are valid and contain no NaN
    routine.forEach((step, idx) => {
      assert.ok(step.time && typeof step.time === 'string', `Step ${idx} must have a time string`);
      assert.ok(!step.time.includes('NaN'), `Step ${idx} time "${step.time}" must not contain NaN`);
    });
  });

  // -------------------------------------------------------------------------
  // TEST 2: Poor AQI with an Outdoor Runner
  // -------------------------------------------------------------------------
  it('2. Poor AQI with an outdoor runner shifts cardio indoors and explains minute ventilation', () => {
    const profile = {
      name: 'Rohan',
      lifestyle: 'working_professional',
      exerciseHabit: 'morning_runner',
      commuteType: 'metro',
      hasAirPurifier: true
    };

    const recs = generateRecommendations(240, profile);
    const routine = generateDynamicRoutine(profile, 240);

    // Verify AQI Classification (CPCB Poor: 201–300)
    assert.equal(recs.aqiResult.category, 'Poor');
    assert.equal(recs.aqiResult.outdoorSafe, false);

    // Verify Exercise Recommendation
    const exerciseRec = recs.recommendationsByDomain['exercise'];
    assert.ok(exerciseRec.action.toLowerCase().includes('indoor'));
    assert.ok(exerciseRec.reason.includes('minute volume') || exerciseRec.reason.includes('minute ventilation'));

    // Verify Routine Step 1 adapts
    const step1 = routine[0];
    assert.ok(step1.title.includes('Indoor'));
    assert.equal(step1.badgeType, 'warning');
    assert.ok(step1.practicalAlternative.includes('indoor'));
  });

  // -------------------------------------------------------------------------
  // TEST 3: Severe AQI with an Essential Commuter
  // -------------------------------------------------------------------------
  it('3. Severe AQI with an essential commuter provides realistic precautions without simply saying stay home', () => {
    const profile = {
      name: 'Priya',
      lifestyle: 'working_professional',
      commuteType: 'car',
      commuteDistanceKm: 15,
      hasAirPurifier: true
    };

    const recs = generateRecommendations(440, profile);
    const routine = generateDynamicRoutine(profile, 440);

    // Verify AQI Classification (CPCB Severe: 401–500)
    assert.equal(recs.aqiResult.category, 'Severe');
    assert.equal(recs.aqiResult.severity, 'emergency');

    // Verify Commute Recommendation (Does NOT say "don't go to work", gives realistic precautions)
    const commuteRec = recs.recommendationsByDomain['commute'];
    assert.ok(commuteRec.action.includes('Recirculation') || commuteRec.action.includes('recirculation'));
    assert.ok(commuteRec.reason.includes('75% to 90%') || commuteRec.reason.includes('diesel'));

    // Verify Routine Commute Step
    const commuteStep = routine[1];
    assert.ok(commuteStep.title.includes('CAR'));
    assert.equal(commuteStep.badgeType, 'alert');
    assert.ok(commuteStep.recommendedAction.includes('Recirculation'));
  });

  // -------------------------------------------------------------------------
  // TEST 4: Poor AQI with a Work-From-Home User
  // -------------------------------------------------------------------------
  it('4. Poor AQI with a work-from-home user prioritizes indoor air control and workspace ventilation', () => {
    const profile = {
      name: 'Aditya',
      lifestyle: 'wfh',
      exerciseHabit: 'none',
      hasAirPurifier: true
    };

    const recs = generateRecommendations(250, profile);
    const routine = generateDynamicRoutine(profile, 250);

    // Verify WFH Lifestyle rule applied
    const lifestyleRec = recs.recommendationsByDomain['lifestyle'];
    assert.ok(lifestyleRec);
    assert.ok(lifestyleRec.action.toLowerCase().includes('workspace') || lifestyleRec.action.toLowerCase().includes('room'));

    // Verify Routine Step 2 is customized to WFH
    const step2 = routine[1];
    assert.equal(step2.category, 'Workspace Setup');
    assert.ok(step2.title.includes('Home Office'));
    assert.ok(step2.recommendedAction.includes('dedicated room'));
  });

  // -------------------------------------------------------------------------
  // TEST 5: User Without an Air Purifier
  // -------------------------------------------------------------------------
  it('5. User without an air purifier receives affordable measures without claiming equivalence to HEPA', () => {
    const profile = {
      name: 'Sunita',
      hasAirPurifier: false,
      lifestyle: 'working_professional'
    };

    const recs = generateRecommendations(220, profile);
    const routine = generateDynamicRoutine(profile, 220);

    // Verify Indoor Recommendation
    const indoorRec = recs.recommendationsByDomain['indoor'];
    assert.ok(indoorRec.action.includes('source control') || indoorRec.action.includes('damp-mop') || indoorRec.action.includes('damp towels'));
    // Must NOT claim affordable measures provide same filtration as True HEPA
    assert.ok(indoorRec.expectedImpact.includes('do not provide') || indoorRec.expectedImpact.includes('affordable measures reduce'));

    // Verify Sleep Sanctuary Step adapts for no purifier
    const sleepStep = routine[4];
    assert.ok(sleepStep.badge.includes('Draft') || sleepStep.badge.includes('Low-Cost'));
    assert.ok(sleepStep.recommendedAction.includes('towel') || sleepStep.recommendedAction.includes('door gap'));
  });

  // -------------------------------------------------------------------------
  // TEST 6: Missing AQI Information
  // -------------------------------------------------------------------------
  it('6. Missing AQI information does not invent data or treat it as zero', () => {
    const profile = { name: 'Kavita' };

    const missingNull = classifyAqi(null);
    const missingUndefined = classifyAqi(undefined);
    const missingEmpty = classifyAqi('');

    assert.equal(missingNull.status, 'MISSING');
    assert.equal(missingNull.valid, false);
    assert.equal(missingNull.aqi, null);
    assert.notEqual(missingNull.aqi, 0); // Must NOT silently treat missing data as zero!

    assert.equal(missingUndefined.status, 'MISSING');
    assert.equal(missingEmpty.status, 'MISSING');

    const recs = generateRecommendations(null, profile);
    assert.ok(recs.overallAdvisory.includes('unavailable') || recs.overallAdvisory.includes('offline'));

    const routine = generateDynamicRoutine(profile, null);
    assert.ok(routine[0].title.includes('Precautionary') || routine[0].title.includes('Indoor'));
    assert.equal(routine[0].badgeType, 'info');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Outdated / Stale AQI Information
  // -------------------------------------------------------------------------
  it('7. Outdated AQI information is identified and flagged as stale', () => {
    const profile = { name: 'Vikram' };
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const staleResult = classifyAqi(180, { timestamp: fourHoursAgo });

    assert.equal(staleResult.status, 'STALE');
    assert.equal(staleResult.isStale, true);
    assert.ok(staleResult.lastUpdatedText.includes('hours ago'));

    const recs = generateRecommendations(180, profile, { timestamp: fourHoursAgo });
    const staleRec = recs.recommendationsByDomain['data_fallback'];
    assert.ok(staleRec);
    assert.ok(staleRec.action.includes('caution') || staleRec.action.includes('shifted'));
  });

  // -------------------------------------------------------------------------
  // TEST 8: Invalid AQI Input
  // -------------------------------------------------------------------------
  it('8. Invalid AQI input is safely rejected without crashing', () => {
    const invalidNegative = classifyAqi(-45);
    const invalidString = classifyAqi('corrupted_sensor_read');
    const invalidNaN = classifyAqi(NaN);

    assert.equal(invalidNegative.status, 'INVALID');
    assert.equal(invalidNegative.valid, false);

    assert.equal(invalidString.status, 'INVALID');
    assert.equal(invalidString.valid, false);

    assert.equal(invalidNaN.status, 'INVALID');
    assert.equal(invalidNaN.valid, false);

    const recs = generateRecommendations(-10);
    assert.equal(recs.aqiResult.valid, false);
    assert.equal(recs.aqiResult.category, 'Invalid Reading');
  });

  // -------------------------------------------------------------------------
  // TEST 9: Improved AQI After Previously Poor Conditions
  // -------------------------------------------------------------------------
  it('9. Improved AQI after previously poor conditions reassesses recommendations to release restrictions', () => {
    const profile = {
      name: 'Deepak',
      exerciseHabit: 'morning_runner'
    };

    // Current AQI is 45 (Good), previously it was 260 (Poor)
    const improvedResult = classifyAqi(45, { previousAqi: 260 });
    assert.equal(improvedResult.trend, 'improving');

    const recs = generateRecommendations(45, profile, { previousAqi: 260 });
    const exerciseRec = recs.recommendationsByDomain['exercise'];

    assert.ok(exerciseRec.action.toLowerCase().includes('improved') || exerciseRec.action.toLowerCase().includes('outdoor'));
    assert.ok(exerciseRec.reason.includes('dropped significantly') || exerciseRec.reason.includes('dispersed'));

    const routine = generateDynamicRoutine(profile, 45, { previousAqi: 260 });
    assert.ok(routine[0].badge.includes('Improving') || routine[0].badge.includes('Optimal'));
  });

  // -------------------------------------------------------------------------
  // TEST 10: User Changing Commute Preference
  // -------------------------------------------------------------------------
  it('10. User changing commute preference changes precautions and calculates defensible impact', () => {
    const profileCar = {
      name: 'Maya',
      commuteType: 'car',
      commuteDistanceKm: 14
    };

    const profileMetro = {
      name: 'Maya',
      commuteType: 'metro',
      commuteDistanceKm: 14
    };

    // Evaluate same AQI 240 with Car vs Metro
    const recsCar = generateRecommendations(240, profileCar);
    const recsMetro = generateRecommendations(240, profileMetro);

    assert.ok(recsCar.recommendationsByDomain['commute'].action.includes('Recirculation'));
    assert.ok(recsMetro.recommendationsByDomain['commute'].action.includes('Metro') || recsMetro.recommendationsByDomain['commute'].action.includes('platforms'));

    // Check Impact Calculator
    const metroImpact = calculateCommuteImpact('metro', 14, 'car');
    assert.equal(metroImpact.valid, true);
    assert.equal(metroImpact.co2AvoidedKg, 1.51); // (140 - 32) * 14 / 1000 = 1.512 kg CO2 avoided
    assert.equal(metroImpact.percentReduction, 77); // ~77% emissions avoided
    assert.equal(metroImpact.isEstimate, true);
    assert.ok(metroImpact.methodologyNote.includes('mathematical estimates'));
  });

});
