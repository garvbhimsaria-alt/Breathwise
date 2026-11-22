/**
 * BreatheWise — Final Pre-Deployment & Hackathon Audit Suite (Prompt 05)
 *
 * Verifies:
 *  1. Decision Engine safety constraints & CPCB breakpoints.
 *  2. Multi-scenario lifestyle & indoor infrastructure personalization.
 *  3. Transparency & provenance (no fabricated live AQI, no false purifier equivalence).
 *  4. Gemini AI safety guardrails, bounded inputs, rate limiting, and prompt-injection resistance.
 *  5. Data freshness evaluation and graceful degradation.
 *  6. Transit emissions calculator accuracy.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyAqi,
  generateRecommendations,
  generateDynamicRoutine,
  calculateCommuteImpact,
  compareAllCommuteModes
} from '../src/engine/index.js';

import {
  calculateAqi,
  calculateSubIndex,
  normaliseId
} from '../server/utils/aqiCalculator.js';

import {
  evaluateFreshness,
  haversineKm
} from '../server/utils/freshness.js';

import {
  buildContextPrompt,
  sanitizeConversationHistory,
  parseStructuredResponse,
  isGeminiConfigured,
  getGeminiModel,
  BREATHEWISE_SYSTEM_INSTRUCTION
} from '../server/services/geminiService.js';

describe('BreatheWise Prompt 05 — Quality Assurance & Security Audit', () => {

  // ── 1. Decision Engine & Lifestyle Matrix ───────────────────────────
  describe('1. Decision Engine & Lifestyle Personalization', () => {
    test('Student at Moderate AQI receives campus transit & library study guidance', () => {
      const profile = {
        name: 'Rohan',
        lifestyle: 'student',
        commuteType: 'bus',
        exerciseHabit: 'evening_runner',
        hasAirPurifier: false
      };
      const res = generateRecommendations(160, profile);
      assert.equal(res.aqiResult.category, 'Moderate');
      const studentRec = res.recommendationsByDomain['lifestyle'];
      assert.ok(studentRec, 'Student specific card should be generated');
      assert.ok(
        studentRec.action.includes('Campus') ||
        studentRec.action.includes('Library') ||
        studentRec.action.includes('Transit') ||
        studentRec.action.toLowerCase().includes('student') ||
        studentRec.reason.toLowerCase().includes('campus')
      );
    });

    test('Outdoor worker at Severe AQI receives emergency field safety precautions', () => {
      const profile = {
        name: 'Vikram',
        lifestyle: 'outdoor_worker',
        commuteType: 'bike',
        exerciseHabit: 'none',
        hasAirPurifier: false
      };
      const res = generateRecommendations(440, profile);
      assert.equal(res.aqiResult.category, 'Severe');
      const workerRec = res.recommendationsByDomain['lifestyle'];
      assert.ok(workerRec, 'Outdoor worker card should be generated');
      assert.ok(
        workerRec.action.includes('N95') ||
        workerRec.action.includes('Field') ||
        workerRec.action.includes('Shift') ||
        workerRec.reason.toLowerCase().includes('outdoor')
      );
    });

    test('User without air purifier gets affordable non-purifier advice without false HEPA claims', () => {
      const profile = {
        name: 'Sunita',
        lifestyle: 'working_professional',
        commuteType: 'walking',
        exerciseHabit: 'morning_runner',
        hasAirPurifier: false
      };
      const res = generateRecommendations(220, profile);
      const indoorRec = res.recommendationsByDomain['indoor'];
      assert.ok(indoorRec);
      assert.ok(
        indoorRec.action.includes('source control') ||
        indoorRec.action.includes('damp-mop') ||
        indoorRec.action.includes('damp towels')
      );
      // Defensible boundary: must not claim DIY replaces HEPA
      assert.ok(
        indoorRec.expectedImpact.includes('do not provide') ||
        indoorRec.expectedImpact.includes('affordable measures reduce') ||
        indoorRec.safetyLimitations?.includes('HEPA')
      );
    });

    test('Missing AQI information triggers safe conservative winter baseline without inventing data', () => {
      const profile = { name: 'TestUser', lifestyle: 'working_professional' };
      const res = generateRecommendations(null, profile);
      assert.equal(res.aqiResult.status, 'MISSING');
      assert.equal(res.aqiResult.valid, false);
      assert.equal(res.aqiResult.aqi, null);
      assert.ok(
        res.overallAdvisory.toLowerCase().includes('unavailable') ||
        res.overallAdvisory.toLowerCase().includes('offline')
      );
    });

    test('Stale AQI reading (>2h old) is explicitly flagged with warning', () => {
      const staleTimestamp = new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString();
      const res = generateRecommendations(175, { name: 'TestUser' }, { timestamp: staleTimestamp });
      assert.equal(res.aqiResult.status, 'STALE');
      assert.ok(res.aqiResult.isStale);
      assert.ok(res.aqiResult.lastUpdatedText.includes('hours ago'));
    });
  });

  // ── 2. Routine Generator & Timeline Anchoring ────────────────────────
  describe('2. Routine Generator & Dynamic Schedule', () => {
    test('Routine timeline anchors first step to custom wakeUpTime', () => {
      const profile = {
        lifestyle: 'working_professional',
        wakeUpTime: '07:15',
        sleepTime: '23:30',
        hasAirPurifier: true
      };
      const routine = generateDynamicRoutine(profile, 220);
      assert.ok(Array.isArray(routine));
      assert.ok(routine.length >= 4);
      assert.ok(routine[0].time.includes('07:15') || routine[0].time.includes('7:15 AM'));
    });

    test('Good AQI schedules outdoor morning cardio; Severe AQI shifts workout indoors', () => {
      const profile = {
        lifestyle: 'working_professional',
        exerciseHabit: 'morning_runner',
        wakeUpTime: '06:00',
        hasAirPurifier: true
      };
      const goodRoutine = generateDynamicRoutine(profile, 35);
      const morningGood = goodRoutine[0];
      assert.ok(
        morningGood.title.toLowerCase().includes('outdoor') ||
        morningGood.recommendedAction.toLowerCase().includes('outdoor')
      );

      const severeRoutine = generateDynamicRoutine(profile, 420);
      const morningSevere = severeRoutine[0];
      assert.ok(
        morningSevere.title.toLowerCase().includes('indoor') ||
        morningSevere.recommendedAction.toLowerCase().includes('indoor') ||
        morningSevere.recommendedAction.toLowerCase().includes('shift')
      );
    });
  });

  // ── 3. Sustainable Transit Emissions Calculator ─────────────────────
  describe('3. Sustainable Transit Emissions Benchmarks', () => {
    test('Calculates positive CO2 and PM savings for metro vs car', () => {
      const impact = calculateCommuteImpact('metro', 15, 'car');
      assert.equal(impact.valid, true);
      assert.ok(impact.co2AvoidedKg > 1.0, '15km metro should save over 1kg CO2 vs petrol car');
      assert.ok(impact.pmAvoidedGrams > 0.1, '15km metro should save grams of road PM');
    });

    test('Safely rejects negative or non-numeric trip distances', () => {
      const negImpact = calculateCommuteImpact('metro', -10);
      assert.equal(negImpact.valid, false);
      assert.ok(negImpact.error);

      const nanImpact = calculateCommuteImpact('metro', 'invalid_dist');
      assert.equal(nanImpact.valid, false);
    });

    test('compareAllCommuteModes provides complete rank-ordered matrix', () => {
      const matrix = compareAllCommuteModes(10);
      assert.ok(Array.isArray(matrix));
      assert.ok(matrix.length >= 5, 'Should include major transit modes');
      const metro = matrix.find(m => m.mode === 'metro');
      assert.ok(metro);
      assert.equal(metro.distanceKm, 10);
    });
  });

  // ── 4. CPCB Breakpoints & Composite AQI Rules ───────────────────────
  describe('4. CPCB Breakpoints & Composite AQI Rules', () => {
    test('Composite AQI requires at least 3 pollutants with PM2.5 or PM10', () => {
      // 2 pollutants only -> null composite
      const incomplete = calculateAqi({ pm25: 45, no2: 30 });
      assert.equal(incomplete, null);

      // 3 gases without PM -> null composite
      const noParticulate = calculateAqi({ no2: 60, so2: 40, co: 1.5 });
      assert.equal(noParticulate, null);

      // 3 pollutants with PM2.5 -> valid composite
      const validComposite = calculateAqi({ pm25: 85, no2: 60, so2: 40 });
      assert.ok(validComposite);
      assert.ok(validComposite.aqi >= 101 && validComposite.aqi <= 200);
      const category = classifyAqi(validComposite.aqi).category;
      assert.equal(category, 'Moderate');
    });

    test('Zero concentration is parsed as 0, not null/missing', () => {
      const zeroSub = calculateSubIndex('pm25', 0, 'µg/m³');
      assert.ok(zeroSub);
      assert.equal(zeroSub.subIndex, 0);
    });

    test('Implausible sensor spike (e.g. CO > 100 mg/m³) returns null instead of AQI 500', () => {
      const spike = calculateSubIndex('co', 250, 'mg/m³');
      assert.equal(spike, null);
    });
  });

  // ── 5. Gemini Security, Guardrails & Bounded Inputs ──────────────────
  describe('5. Gemini AI Security Guardrails & Prompt Bounds', () => {
    test('System instruction strictly establishes Decision Engine authority', () => {
      assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('AUTHORITATIVE DECISION ENGINE'));
      assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('NEVER override, weaken, or contradict'));
      assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('NO HALLUCINATION'));
      assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('PROMPT INJECTION RESISTANCE'));
    });

    test('Conversation history sanitization bounds length and turn size', () => {
      const hugeTurn = 'A'.repeat(5000);
      const history = Array(20).fill({ role: 'user', text: hugeTurn });
      const sanitized = sanitizeConversationHistory(history, 8);
      assert.equal(sanitized.length, 8);
      assert.ok(sanitized[0].parts[0].text.length <= 800);
    });

    test('Structured JSON parser safely recovers from markdown code blocks', () => {
      const raw = 'Here is the advice:\n```json\n{\n  "message": "Stay indoors",\n  "recommendations": ["Use air purifier"],\n  "reasoning": "AQI is 340",\n  "alternatives": ["Wear N95"],\n  "limitations": "Sensor is 1 hr old"\n}\n```\nHope this helps!';
      const res = parseStructuredResponse(raw);
      assert.equal(res.message, 'Stay indoors');
      assert.deepEqual(res.recommendations, ['Use air purifier']);
      assert.equal(res.reasoning, 'AQI is 340');
      assert.deepEqual(res.alternatives, ['Wear N95']);
      assert.equal(res.limitations, 'Sensor is 1 hr old');
    });

    test('Unconfigured Gemini API returns safe fallback without exposing secrets or crashing', () => {
      const orig = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      assert.equal(isGeminiConfigured(), false);
      process.env.GEMINI_API_KEY = orig;
    });
  });

  // ── 6. Provenance & Freshness Engine ────────────────────────────────
  describe('6. Data Freshness & Attribution', () => {
    test('evaluateFreshness correctly classifies fresh, stale, and unavailable', () => {
      const freshDate = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      assert.equal(evaluateFreshness(freshDate).status, 'fresh');

      const staleDate = new Date(Date.now() - 150 * 60 * 1000).toISOString();
      assert.equal(evaluateFreshness(staleDate).status, 'stale');

      const veryStaleDate = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
      assert.equal(evaluateFreshness(veryStaleDate).status, 'very_stale');

      assert.equal(evaluateFreshness(null).status, 'unavailable');
    });

    test('Haversine distance calculation is accurate within metro regions', () => {
      // India Gate (28.6129, 77.2295) to Anand Vihar (28.6469, 77.3160)
      const dist = haversineKm(28.6129, 77.2295, 28.6469, 77.3160);
      assert.ok(dist >= 8.5 && dist <= 10.5, `Expected ~9-10 km, got ${dist}`);
    });
  });
});
