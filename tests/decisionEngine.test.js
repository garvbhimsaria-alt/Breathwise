/**
 * BreatheWise Decision Engine Test Suite — Extended
 *
 * Tests all scenarios using Node.js native test runner (node:test).
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lightweight AI intent router — mirrors the logic inside AiAssistant.jsx
 * so we can unit-test it without rendering React.
 */
function routeQuery(query, { cityName = 'Delhi', aqi = 150, name = 'User' } = {}) {
  const raw = query.trim();
  const clean = raw.toLowerCase().replace(/[?!.,;:']/g, '');

  // Greeting
  const isGreeting =
    /^(hi|hello|hey|heyy|heya|howdy|good morning|good afternoon|good evening|greetings|sup|yo)$/i.test(clean) ||
    clean.startsWith('hi ') || clean.startsWith('hello ') || clean.startsWith('hey ') ||
    clean === 'hi breathewise' || clean === 'hello breathewise';
  if (isGreeting) return 'GREETING';

  // Gratitude
  const isGratitude = /^(thanks|thank you|thx|thank you so much|thanks a lot|appreciate it|thank u|ty)$/i.test(clean) ||
    clean.includes('thank you') || clean.includes('thanks');
  if (isGratitude) return 'GRATITUDE';

  // Goodbye
  const isGoodbye = /^(bye|goodbye|cya|see you|take care|good night|have a good day|have a nice day)$/i.test(clean) ||
    clean.includes('goodbye') || clean.includes('bye bye') || clean.startsWith('bye ');
  if (isGoodbye) return 'GOODBYE';

  // Identity
  const isIdentity =
    clean.includes('who are you') || clean.includes('who created you') || clean.includes('who made you') ||
    clean.includes('who built you') || clean.includes('what can you do') || clean.includes('what do you do') ||
    clean.includes('what are your capabilities') || clean.includes('capabilities') ||
    clean.includes('what can you help') || clean.includes('help me with') ||
    clean.includes('what is breathewise') || clean.includes('about breathewise') ||
    clean === 'help';
  if (isIdentity) return 'IDENTITY';

  // AQI FAQ
  if (clean.includes('what is aqi') || clean.includes('explain aqi') || clean.includes('air quality index') || clean === 'aqi') return 'FAQ_AQI';

  // PM2.5 FAQ
  if (clean.includes('pm25') || clean.includes('pm2.5') || clean.includes('particulate matter 2.5')) return 'FAQ_PM25';

  // PM10 FAQ
  if (clean.includes('pm10') || clean.includes('what is pm10') || clean.includes('coarse dust')) return 'FAQ_PM10';

  // Smog/Inversion
  if (clean.includes('what is smog') || clean.includes('define smog') || clean.includes('thermal inversion') || clean.includes('winter inversion') || clean.includes('inversion')) return 'FAQ_SMOG';

  // Lungs / Respiratory
  if (clean.includes('lung') || clean.includes('lungs') || clean.includes('respiratory')) return 'FAQ_LUNGS';

  // Heart / Cardiovascular
  if (clean.includes('heart') || clean.includes('cardio') || clean.includes('blood pressure') || clean.includes('stroke')) return 'FAQ_HEART';

  // Diet / Nutrition
  if (clean.includes('eat') || clean.includes('food') || clean.includes('diet') || clean.includes('nutrition') || clean.includes('turmeric') || clean.includes('antioxidant')) return 'FAQ_DIET';

  // Severe AQI Protocol
  if (clean.includes('severe aqi') || clean.includes('aqi above 400') || clean.includes('hazardous aqi') || clean.includes('emergency protocol')) return 'FAQ_SEVERE';

  // Exercise
  if (clean.includes('exercise') || clean.includes('workout') || clean.includes('run') || clean.includes('jog') || clean.includes('gym') || clean.includes('cycling') || clean.includes('outdoor workout')) return 'EXERCISE_SAFETY';

  // Indoor air
  if (clean.includes('indoor') || clean.includes('purifier') || clean.includes('air at home') || clean.includes('clean air inside')) return 'INDOOR_AIR';

  // Commute
  if (clean.includes('commute') || clean.includes('traffic') || clean.includes('metro') || clean.includes('carpool') || clean.includes('transit')) return 'COMMUTE';

  // Reduce
  if (clean.includes('reduce') || clean.includes('contribution') || clean.includes('sustainable') || clean.includes('cut emissions') || clean.includes('how can i help')) return 'REDUCE_CONTRIBUTION';

  // Houseplants
  if (clean.includes('plant') || clean.includes('houseplant') || clean.includes('snake plant')) return 'HOUSEPLANTS';

  // Mask
  if (clean.includes('mask') || clean.includes('n95') || clean.includes('respirator')) return 'MASK_GUIDE';

  // Vulnerable groups
  if (clean.includes('asthma') || clean.includes('child') || clean.includes('kids') || clean.includes('senior') || clean.includes('elderly') || clean.includes('baby')) return 'VULNERABLE_GROUPS';

  // Planning (strict intent check)
  const isPlanning =
    clean.includes('plan my day') || clean.includes('daily plan') || clean.includes('daily routine') ||
    clean.includes('schedule my day') || clean.includes('plan today') || clean.includes('plan my routine') ||
    clean.includes('how should i plan') ||
    (clean.includes('routine') && (clean.includes('day') || clean.includes('smog') || clean.includes('aqi')));
  if (isPlanning) return 'DAILY_PLAN';

  return 'FALLBACK';
}

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

    assert.equal(recs.aqiResult.valid, true);
    assert.equal(recs.aqiResult.category, 'Good');
    assert.equal(recs.aqiResult.outdoorSafe, true);

    const exerciseRec = recs.recommendationsByDomain['exercise'];
    assert.ok(exerciseRec.action.toLowerCase().includes('outdoor'));
    assert.ok(exerciseRec.reason.toLowerCase().includes('clean'));

    const step1 = routine[0];
    assert.ok(step1.title.includes('Outdoor'));
    assert.equal(step1.badgeType, 'success');
    assert.ok(step1.recommendedAction.toLowerCase().includes('outdoor') || step1.recommendedAction.toLowerCase().includes('unrestricted'));

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

    assert.equal(recs.aqiResult.category, 'Poor');
    assert.equal(recs.aqiResult.outdoorSafe, false);

    const exerciseRec = recs.recommendationsByDomain['exercise'];
    assert.ok(exerciseRec.action.toLowerCase().includes('indoor'));
    assert.ok(exerciseRec.reason.includes('minute volume') || exerciseRec.reason.includes('minute ventilation'));

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

    assert.equal(recs.aqiResult.category, 'Severe');
    assert.equal(recs.aqiResult.severity, 'emergency');

    const commuteRec = recs.recommendationsByDomain['commute'];
    assert.ok(commuteRec.action.includes('Recirculation') || commuteRec.action.includes('recirculation') || commuteRec.action.toLowerCase().includes('ac recirculation') || commuteRec.action.toLowerCase().includes('sealed'));
    assert.ok(commuteRec.reason.includes('75% to 90%') || commuteRec.reason.includes('diesel') || commuteRec.reason.toLowerCase().includes('severe') || commuteRec.reason.toLowerCase().includes('extreme'));

    const commuteStep = routine[1];
    assert.ok(commuteStep.title.includes('CAR'));
    assert.equal(commuteStep.badgeType, 'alert');
    assert.ok(commuteStep.recommendedAction.toLowerCase().includes('recirculation') || commuteStep.recommendedAction.toLowerCase().includes('sealed') || commuteStep.recommendedAction.toLowerCase().includes('n95'));
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

    const lifestyleRec = recs.recommendationsByDomain['lifestyle'];
    assert.ok(lifestyleRec);
    assert.ok(lifestyleRec.action.toLowerCase().includes('workspace') || lifestyleRec.action.toLowerCase().includes('room'));

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

    const indoorRec = recs.recommendationsByDomain['indoor'];
    assert.ok(indoorRec.action.includes('source control') || indoorRec.action.includes('damp-mop') || indoorRec.action.includes('damp towels'));
    assert.ok(indoorRec.expectedImpact.includes('do not provide') || indoorRec.expectedImpact.includes('affordable measures reduce'));

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
    assert.notEqual(missingNull.aqi, 0);

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
    const profileCar   = { name: 'Maya', commuteType: 'car',   commuteDistanceKm: 14 };
    const profileMetro = { name: 'Maya', commuteType: 'metro', commuteDistanceKm: 14 };

    const recsCar   = generateRecommendations(240, profileCar);
    const recsMetro = generateRecommendations(240, profileMetro);

    assert.ok(recsCar.recommendationsByDomain['commute'].action.includes('Recirculation'));
    assert.ok(recsMetro.recommendationsByDomain['commute'].action.includes('Metro') || recsMetro.recommendationsByDomain['commute'].action.includes('platforms'));

    const metroImpact = calculateCommuteImpact('metro', 14, 'car');
    assert.equal(metroImpact.valid, true);
    assert.equal(metroImpact.co2AvoidedKg, 1.51);
    assert.equal(metroImpact.percentReduction, 77);
    assert.equal(metroImpact.isEstimate, true);
    assert.ok(metroImpact.methodologyNote.includes('mathematical estimates'));
  });

  // =========================================================================
  // NEW TESTS: Profile Synchronization & Lifestyle Adaptation
  // =========================================================================

  it('11. Student lifestyle at Moderate AQI generates campus-appropriate schedule', () => {
    const profile = {
      name: 'Ankita',
      lifestyle: 'student',
      hasAirPurifier: false,
      wakeUpTime: '07:00',
      sleepTime: '23:00'
    };
    const routine = generateDynamicRoutine(profile, 145);
    // All step timestamps must be valid strings without NaN
    routine.forEach((step, idx) => {
      assert.ok(step.time && typeof step.time === 'string', `Student step ${idx} must have a time string`);
      assert.ok(!step.time.includes('NaN'), `Student step ${idx} time "${step.time}" must not contain NaN`);
    });
    // Step 1 must acknowledge moderate outdoor situation
    const step1 = routine[0];
    assert.ok(step1.recommendedAction, 'Step 1 must have a recommendedAction');
    assert.ok(step1.reasoning || step1.reason, 'Step 1 must have reasoning');
  });

  it('12. Outdoor worker lifestyle at Very Poor AQI provides emergency field safety guidance', () => {
    const profile = {
      name: 'Raman',
      lifestyle: 'outdoor_worker',
      hasAirPurifier: false,
      wakeUpTime: '05:30',
      sleepTime: '21:30'
    };
    const recs = generateRecommendations(350, profile);
    const routine = generateDynamicRoutine(profile, 350);

    assert.equal(recs.aqiResult.category, 'Very Poor');
    // Lifestyle rule must address outdoor worker specifically
    const lifestyleRec = recs.recommendationsByDomain['lifestyle'];
    assert.ok(lifestyleRec, 'Lifestyle domain must have a recommendation');
    assert.ok(lifestyleRec.action.toLowerCase().includes('worker') || lifestyleRec.action.toLowerCase().includes('field') || lifestyleRec.action.toLowerCase().includes('outdoor'), 'Lifestyle rec must address outdoor work');

    routine.forEach((step, idx) => {
      assert.ok(!step.time.includes('NaN'), `Outdoor worker step ${idx} time "${step.time}" must not contain NaN`);
    });
  });

  it('13. Work-from-home lifestyle at Good AQI allows window ventilation', () => {
    const profile = {
      name: 'Preethi',
      lifestyle: 'wfh',
      hasAirPurifier: true,
      wakeUpTime: '08:00',
      sleepTime: '23:30'
    };
    const recs = generateRecommendations(42, profile);
    assert.equal(recs.aqiResult.category, 'Good');
    const lifestyleRec = recs.recommendationsByDomain['lifestyle'];
    assert.ok(lifestyleRec.action.toLowerCase().includes('workspace') || lifestyleRec.action.toLowerCase().includes('window') || lifestyleRec.action.toLowerCase().includes('ventilat'), 'WFH Good AQI must encourage ventilation');
  });

  it('14. Working professional lifestyle at Severe AQI warns against rush hour commute', () => {
    const profile = {
      name: 'Suresh',
      lifestyle: 'working_professional',
      commuteType: 'car',
      hasAirPurifier: true,
      wakeUpTime: '06:00',
      sleepTime: '22:00'
    };
    const recs = generateRecommendations(430, profile);
    assert.equal(recs.aqiResult.category, 'Severe');
    const commuteRec = recs.recommendationsByDomain['commute'];
    assert.ok(commuteRec.action.includes('Recirculation') || commuteRec.action.includes('recirculation'), 'Severe commute must mandate recirculation');
  });

  // =========================================================================
  // NEW TESTS: CPCB AQI Boundary Values
  // =========================================================================

  it('15. CPCB AQI boundary: AQI 0 → Good', () => {
    const r = classifyAqi(0);
    assert.equal(r.valid, true);
    assert.equal(r.category, 'Good');
  });

  it('16. CPCB AQI boundary: AQI 50 → Good', () => {
    const r = classifyAqi(50);
    assert.equal(r.category, 'Good');
  });

  it('17. CPCB AQI boundary: AQI 51 → Satisfactory', () => {
    const r = classifyAqi(51);
    assert.equal(r.category, 'Satisfactory');
  });

  it('18. CPCB AQI boundary: AQI 100 → Satisfactory', () => {
    const r = classifyAqi(100);
    assert.equal(r.category, 'Satisfactory');
  });

  it('19. CPCB AQI boundary: AQI 101 → Moderate', () => {
    const r = classifyAqi(101);
    assert.equal(r.category, 'Moderate');
  });

  it('20. CPCB AQI boundary: AQI 200 → Moderate', () => {
    const r = classifyAqi(200);
    assert.equal(r.category, 'Moderate');
  });

  it('21. CPCB AQI boundary: AQI 201 → Poor', () => {
    const r = classifyAqi(201);
    assert.equal(r.category, 'Poor');
  });

  it('22. CPCB AQI boundary: AQI 300 → Poor', () => {
    const r = classifyAqi(300);
    assert.equal(r.category, 'Poor');
  });

  it('23. CPCB AQI boundary: AQI 301 → Very Poor', () => {
    const r = classifyAqi(301);
    assert.equal(r.category, 'Very Poor');
  });

  it('24. CPCB AQI boundary: AQI 400 → Very Poor', () => {
    const r = classifyAqi(400);
    assert.equal(r.category, 'Very Poor');
  });

  it('25. CPCB AQI boundary: AQI 401 → Severe', () => {
    const r = classifyAqi(401);
    assert.equal(r.category, 'Severe');
  });

  it('26. CPCB AQI boundary: AQI 500 → Severe', () => {
    const r = classifyAqi(500);
    assert.equal(r.category, 'Severe');
  });

  it('27. CPCB AQI boundary: AQI >500 → Severe (capped, valid)', () => {
    const r = classifyAqi(601);
    assert.equal(r.category, 'Severe');
    assert.equal(r.valid, true);
  });

  it('28. CPCB AQI boundary: null → MISSING', () => {
    assert.equal(classifyAqi(null).status, 'MISSING');
  });

  it('29. CPCB AQI boundary: undefined → MISSING', () => {
    assert.equal(classifyAqi(undefined).status, 'MISSING');
  });

  it('30. CPCB AQI boundary: invalid string → INVALID', () => {
    assert.equal(classifyAqi('bad').status, 'INVALID');
  });

  // =========================================================================
  // NEW TESTS: AI Assistant Query Routing
  // =========================================================================

  it('31. AI router: "Hi" → GREETING (not AQI consultation)', () => {
    assert.equal(routeQuery('Hi'), 'GREETING');
  });

  it('32. AI router: "Hello" → GREETING', () => {
    assert.equal(routeQuery('Hello'), 'GREETING');
  });

  it('33. AI router: "Hey BreatheWise" → GREETING', () => {
    assert.equal(routeQuery('Hey BreatheWise'), 'GREETING');
  });

  it('34. AI router: "Good morning" → GREETING', () => {
    assert.equal(routeQuery('Good morning'), 'GREETING');
  });

  it('35. AI router: "Who are you?" → IDENTITY', () => {
    assert.equal(routeQuery('Who are you?'), 'IDENTITY');
  });

  it('36. AI router: "Who created you?" → IDENTITY', () => {
    assert.equal(routeQuery('Who created you?'), 'IDENTITY');
  });

  it('37. AI router: "What can you help me with?" → IDENTITY', () => {
    assert.equal(routeQuery('What can you help me with?'), 'IDENTITY');
  });

  it('38. AI router: "What are your capabilities?" → IDENTITY', () => {
    assert.equal(routeQuery('What are your capabilities?'), 'IDENTITY');
  });

  it('39. AI router: "What is AQI?" → FAQ_AQI', () => {
    assert.equal(routeQuery('What is AQI?'), 'FAQ_AQI');
  });

  it('40. AI router: "What is PM2.5?" → FAQ_PM25', () => {
    assert.equal(routeQuery('What is PM2.5?'), 'FAQ_PM25');
  });

  it('41. AI router: "How does air pollution affect the heart?" → FAQ_HEART', () => {
    assert.equal(routeQuery('How does air pollution affect the heart?'), 'FAQ_HEART');
  });

  it('42. AI router: "What should I eat on a high pollution day?" → FAQ_DIET (not DAILY_PLAN)', () => {
    const intent = routeQuery('What should I eat on a high pollution day?');
    assert.equal(intent, 'FAQ_DIET');
    assert.notEqual(intent, 'DAILY_PLAN');
  });

  it('43. AI router: "How should I commute during smog?" → COMMUTE', () => {
    assert.equal(routeQuery('How should I commute during smog?'), 'COMMUTE');
  });

  it('44. AI router: "How should I plan my day?" → DAILY_PLAN', () => {
    assert.equal(routeQuery('How should I plan my day?'), 'DAILY_PLAN');
  });

  it('45. AI router: "fdskjhfds xyz nonsense" → FALLBACK', () => {
    assert.equal(routeQuery('fdskjhfds xyz nonsense'), 'FALLBACK');
  });

  it('46. AI router: "Thank you so much!" → GRATITUDE', () => {
    assert.equal(routeQuery('Thank you so much!'), 'GRATITUDE');
  });

  it('47. AI router: "Goodbye" → GOODBYE', () => {
    assert.equal(routeQuery('Goodbye'), 'GOODBYE');
  });

  // =========================================================================
  // NEW TESTS: LocationModal Null/Undefined AQI Handling
  // =========================================================================

  it('48. classifyAqi with null AQI returns a safe neutral object without crashing', () => {
    const r = classifyAqi(null);
    assert.equal(r.valid, false);
    assert.equal(r.status, 'MISSING');
    assert.ok(r.bgColor, 'Must have a fallback bgColor for rendering');
    assert.ok(r.borderColor, 'Must have a fallback borderColor for rendering');
    assert.ok(r.color, 'Must have a fallback color for rendering');
    assert.ok(r.textColor, 'Must have a fallback textColor for rendering');
    assert.ok(r.category, 'Must have a fallback category string');
  });

  it('49. classifyAqi with undefined AQI returns a safe neutral object without crashing', () => {
    const r = classifyAqi(undefined);
    assert.equal(r.valid, false);
    assert.ok(r.bgColor);
    assert.ok(r.category);
  });

  it('50. Wake-up time anchoring: routine step 1 timestamp follows the configured wake-up time', () => {
    const earlyRiser = { name: 'Early', lifestyle: 'working_professional', wakeUpTime: '05:30', sleepTime: '21:30', hasAirPurifier: true };
    const lateRiser  = { name: 'Late',  lifestyle: 'working_professional', wakeUpTime: '08:30', sleepTime: '23:30', hasAirPurifier: true };

    const earlyRoutine = generateDynamicRoutine(earlyRiser, 150);
    const lateRoutine  = generateDynamicRoutine(lateRiser,  150);

    // The first step time must differ between the two wake-up profiles
    assert.notEqual(earlyRoutine[0].time, lateRoutine[0].time, 'Step 1 time must anchor to wake-up time');

    // Timestamps must be valid, non-NaN strings
    [earlyRoutine, lateRoutine].forEach((routine, ri) => {
      routine.forEach((step, si) => {
        assert.ok(!step.time.includes('NaN'), `Profile ${ri} step ${si} has NaN in time: "${step.time}"`);
      });
    });
  });

});
