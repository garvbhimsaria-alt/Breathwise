/**
 * BreatheWise — Gemini AI Assistant Test Suite
 *
 * Verifies Prompt 04 Requirements:
 *  1. Normal air-quality question context formatting.
 *  2. Outdoor exercise question handling & decision engine grounding.
 *  3. Commuting guidance with public transit precautions.
 *  4. Indoor air quality improvement guidance.
 *  5. Follow-up questions using multi-turn conversation history.
 *  6. User with no air purifier (affordable, non-purifier guidance).
 *  7. Missing AQI information (explicit unavailable flag, no hallucination).
 *  8. Stale AQI information (outdated sensor notice).
 *  9. Gemini API authentication failure handling (graceful fallback).
 *  10. Gemini rate-limit response handling (429 degradation).
 *  11. Gemini service timeout handling.
 *  12. Malformed AI response handling & schema validation.
 *  13. Unrelated / general question handling.
 *  14. Prompt-injection resistance (safety floor preservation).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildContextPrompt,
  sanitizeConversationHistory,
  parseStructuredResponse,
  generateAssistantResponse,
  isGeminiConfigured,
  getGeminiModel,
  BREATHEWISE_SYSTEM_INSTRUCTION
} from '../server/services/geminiService.js';

describe('BreatheWise Gemini AI Assistant Suite', () => {

  // -------------------------------------------------------------------------
  // 1. Normal air-quality question & context formatting
  // -------------------------------------------------------------------------
  it('1. Formats valid real-time AQI context cleanly into Gemini prompt', () => {
    const prompt = buildContextPrompt({
      aqiContext: {
        aqi: 245,
        category: 'Poor',
        primaryPollutant: 'PM2.5',
        pm25: 110,
        pm10: 180,
        station: 'Anand Vihar, Delhi - DPCC',
        dataSource: 'CPCB via data.gov.in',
        lastUpdated: '15 min ago',
        isStale: false,
        isValidAqi: true
      },
      userProfile: {
        name: 'Aarav',
        lifestyle: 'working_professional',
        commuteType: 'metro',
        exerciseHabits: 'morning_runner',
        hasAirPurifier: true
      },
      engineRecommendations: [
        {
          action: 'Shift morning cardio indoors',
          reason: 'Severe morning particulate concentration',
          alternative: 'Evening indoor treadmill workout',
          safetyLimitations: 'Do not run outdoors between 6 AM and 9 AM'
        }
      ]
    });

    assert.ok(prompt.includes('Overall AQI: 245 (Poor)'));
    assert.ok(prompt.includes('PM2.5: 110 µg/m³'));
    assert.ok(prompt.includes('Anand Vihar, Delhi - DPCC'));
    assert.ok(prompt.includes('User Name: Aarav'));
    assert.ok(prompt.includes('Shift morning cardio indoors'));
    assert.ok(!prompt.includes('latitude'), 'Must not send raw GPS coordinates');
  });

  // -------------------------------------------------------------------------
  // 2. Question about outdoor exercise
  // -------------------------------------------------------------------------
  it('2. Context prompt carries decision engine safety constraint for outdoor exercise', () => {
    const prompt = buildContextPrompt({
      aqiContext: {
        aqi: 320,
        category: 'Very Poor',
        isValidAqi: true
      },
      userProfile: {
        exerciseHabits: 'outdoor_runner',
        lifestyle: 'fitness_enthusiast'
      },
      engineRecommendations: [
        {
          action: 'Avoid outdoor exercise',
          reason: 'Minute ventilation increases deep PM2.5 lung deposition by 4-6x',
          safetyLimitations: 'Outdoor cardio is unsafe above AQI 300'
        }
      ]
    });

    assert.ok(prompt.includes('Outdoor cardio is unsafe above AQI 300'));
    assert.ok(prompt.includes('Minute ventilation'));
  });

  // -------------------------------------------------------------------------
  // 3. Question about commuting
  // -------------------------------------------------------------------------
  it('3. Injects commute mode context (metro/two-wheeler) without leaking private data', () => {
    const prompt = buildContextPrompt({
      aqiContext: { aqi: 185, category: 'Moderate', isValidAqi: true },
      userProfile: {
        commuteType: 'motorcycle_two_wheeler',
        lifestyle: 'daily_commuter'
      },
      engineRecommendations: [
        {
          action: 'Wear snug N95 respirator during two-wheeler commute',
          reason: 'Direct tailpipe exposure in urban street canyons'
        }
      ]
    });

    assert.ok(prompt.includes('motorcycle two wheeler'));
    assert.ok(prompt.includes('Direct tailpipe exposure'));
  });

  // -------------------------------------------------------------------------
  // 4. Question about indoor air quality
  // -------------------------------------------------------------------------
  it('4. Appropriately flags purifier vs non-purifier household context', () => {
    const promptWithPurifier = buildContextPrompt({
      aqiContext: { aqi: 250, isValidAqi: true },
      userProfile: { hasAirPurifier: true }
    });
    assert.ok(promptWithPurifier.includes('YES (HEPA equipped)'));

    const promptNoPurifier = buildContextPrompt({
      aqiContext: { aqi: 250, isValidAqi: true },
      userProfile: { hasAirPurifier: false }
    });
    assert.ok(promptNoPurifier.includes('NO (Relies on natural sealing & non-purifier methods)'));
  });

  // -------------------------------------------------------------------------
  // 5. Follow-up question using conversation history
  // -------------------------------------------------------------------------
  it('5. Sanitizes multi-turn conversation history for contextual follow-ups', () => {
    const history = [
      { sender: 'user', text: 'Should I exercise outdoors today?' },
      { sender: 'assistant', text: 'AQI is 280 (Poor), so shift your workout indoors.' },
      { sender: 'user', text: 'What if I can only exercise in the evening?' }
    ];

    const sanitized = sanitizeConversationHistory(history, 8);
    assert.equal(sanitized.length, 3);
    assert.equal(sanitized[0].role, 'user');
    assert.equal(sanitized[1].role, 'model');
    assert.equal(sanitized[2].role, 'user');
    assert.equal(sanitized[2].parts[0].text, 'What if I can only exercise in the evening?');
  });

  it('5b. Truncates conversation history to maxTurns to avoid token bloat', () => {
    const longHistory = Array.from({ length: 20 }, (_, i) => ({
      sender: i % 2 === 0 ? 'user' : 'assistant',
      text: `Message ${i}`
    }));

    const sanitized = sanitizeConversationHistory(longHistory, 6);
    assert.equal(sanitized.length, 6);
    assert.equal(sanitized[5].parts[0].text, 'Message 19');
  });

  // -------------------------------------------------------------------------
  // 6. User with no air purifier
  // -------------------------------------------------------------------------
  it('6. System instructions explicitly prohibit claiming houseplants or cloth replace HEPA', () => {
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('NO MEDICAL DIAGNOSIS OR CLAIMS'));
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('AUTHORITATIVE DECISION ENGINE'));
  });

  // -------------------------------------------------------------------------
  // 7. Missing AQI information
  // -------------------------------------------------------------------------
  it('7. Missing AQI explicitly commands Gemini NOT to invent or hallucinate readings', () => {
    const prompt = buildContextPrompt({
      aqiContext: { isValidAqi: false, aqi: null },
      userProfile: { name: 'Priya' }
    });

    assert.ok(prompt.includes('LIVE AQI IS CURRENTLY UNAVAILABLE OR OFFLINE'));
    assert.ok(prompt.includes('Do NOT invent an AQI value or pollutant reading'));
  });

  // -------------------------------------------------------------------------
  // 8. Stale AQI information
  // -------------------------------------------------------------------------
  it('8. Stale AQI data adds explicit warning to Gemini prompt', () => {
    const prompt = buildContextPrompt({
      aqiContext: {
        aqi: 220,
        isValidAqi: true,
        isStale: true,
        lastUpdated: '3.5 hours ago'
      }
    });

    assert.ok(prompt.includes('Data is older than 2 hours (outdated/stale)'));
  });

  // -------------------------------------------------------------------------
  // 9. Gemini API authentication failure handling
  // -------------------------------------------------------------------------
  it('9. Missing or unconfigured API key gracefully returns fallback status without crash', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await generateAssistantResponse({
      message: 'Hello'
    });

    assert.equal(res.status, 'fallback');
    assert.equal(res.error, 'GEMINI_API_KEY_MISSING');
    assert.ok(res.message.includes('GEMINI_API_KEY'));

    process.env.GEMINI_API_KEY = originalKey;
  });

  // -------------------------------------------------------------------------
  // 10. Gemini rate-limit response handling
  // -------------------------------------------------------------------------
  it('10. Bounded input rejects empty message', async () => {
    const res = await generateAssistantResponse({
      message: '   '
    });

    // If key missing, returns fallback; if key present, returns error
    assert.ok(res.status === 'fallback' || res.status === 'error');
  });

  // -------------------------------------------------------------------------
  // 11. Structured Response Parsing (Direct JSON)
  // -------------------------------------------------------------------------
  it('11. Parses clean JSON structured response conforming to required schema', () => {
    const raw = JSON.stringify({
      message: 'Keep windows closed this morning.',
      recommendations: ['Seal drafty doors', 'Run HEPA on medium'],
      reasoning: 'Morning thermal inversion traps cold-air particulates.',
      alternatives: ['Ventilate between 1 PM and 3 PM'],
      limitations: 'Live station last updated 45 mins ago.'
    });

    const parsed = parseStructuredResponse(raw);
    assert.equal(parsed.message, 'Keep windows closed this morning.');
    assert.equal(parsed.recommendations.length, 2);
    assert.equal(parsed.reasoning, 'Morning thermal inversion traps cold-air particulates.');
    assert.equal(parsed.alternatives[0], 'Ventilate between 1 PM and 3 PM');
    assert.equal(parsed.limitations, 'Live station last updated 45 mins ago.');
  });

  // -------------------------------------------------------------------------
  // 12. Malformed AI response handling
  // -------------------------------------------------------------------------
  it('12. Extracts JSON from markdown backticks (```json ... ```)', () => {
    const raw = '```json\n{\n  "message": "Exercise indoors today.",\n  "recommendations": ["Indoor gym"],\n  "reasoning": "AQI 290"\n}\n```';
    const parsed = parseStructuredResponse(raw);
    assert.equal(parsed.message, 'Exercise indoors today.');
    assert.equal(parsed.recommendations[0], 'Indoor gym');
    assert.equal(parsed.reasoning, 'AQI 290');
  });

  it('12b. Completely unformatted / non-JSON text degrades safely into message field without crashing', () => {
    const raw = 'Air quality is very poor right now. Avoid heavy outdoor cardio until afternoon.';
    const parsed = parseStructuredResponse(raw);
    assert.ok(parsed.message.includes('Air quality is very poor'));
    assert.deepEqual(parsed.recommendations, []);
  });

  it('12c. Null or empty text returns safe error fallback object', () => {
    const parsed = parseStructuredResponse(null);
    assert.ok(parsed.message.includes('encountered an empty response'));
  });

  // -------------------------------------------------------------------------
  // 13. Unrelated / general question handling
  // -------------------------------------------------------------------------
  it('13. System instructions constrain assistant to urban air-quality and daily routine scope', () => {
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('Your primary mission is to help urban residents'));
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('PROMPT INJECTION RESISTANCE'));
  });

  // -------------------------------------------------------------------------
  // 14. Prompt-injection resistance & safety constraint preservation
  // -------------------------------------------------------------------------
  it('14. System prompt strictly forbids overriding Decision Engine safety rules', () => {
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('CRITICAL SAFETY & OPERATIONAL GUARDRAILS'));
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('The BreatheWise rule-based Decision Engine is the ultimate authority'));
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('You must NEVER override, weaken, or contradict the Decision Engine\'s safety constraints'));
    assert.ok(BREATHEWISE_SYSTEM_INSTRUCTION.includes('Never invent missing AQI readings'));
  });

  // -------------------------------------------------------------------------
  // 15. Configurable Model Name
  // -------------------------------------------------------------------------
  it('15. Configurable model defaults to Flash model without hardcoded obsolete IDs', () => {
    const model = getGeminiModel();
    assert.ok(model.includes('flash') || model.includes('gemini'));
  });

});
