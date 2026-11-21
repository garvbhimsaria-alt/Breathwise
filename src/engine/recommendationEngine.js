/**
 * BreatheWise Recommendation Engine
 * 
 * Orchestrates AQI classification, evaluates decision rules against the user's
 * specific profile and environmental context, and produces explainable recommendations.
 * 
 * Also formats a structured context payload for future Gemini Generative AI integration.
 */

import { classifyAqi } from './aqiClassifier.js';
import { DECISION_RULES } from './decisionRules.js';

/**
 * Main engine entry point: produces personalized, explainable recommendations.
 * 
 * @param {number|string|null} aqiInput - Raw AQI or pollutant reading
 * @param {Object} [userProfile={}] - User preferences, lifestyle, and health sensitivity
 * @param {Object} [options={}] - Options (timestamp, isDemo, previousAqi, location)
 * @returns {Object} Comprehensive, explainable recommendation package
 */
export function generateRecommendations(aqiInput, userProfile = {}, options = {}) {
  // 1. Classify AQI according to official CPCB breakpoints and check freshness
  const aqiResult = classifyAqi(aqiInput, {
    timestamp: options.timestamp || null,
    isDemo: options.isDemo !== undefined ? options.isDemo : true,
    previousAqi: options.previousAqi || null
  });

  // 2. Prepare context for rule evaluation
  const context = {
    aqiResult,
    profile: {
      name: userProfile.name || 'Friend',
      lifestyle: userProfile.lifestyle || 'working_professional',
      commuteType: userProfile.commuteType || 'metro',
      commuteDistanceKm: Number(userProfile.commuteDistanceKm) || 10,
      exerciseHabit: userProfile.exerciseHabit || 'morning_runner',
      outdoorTime: userProfile.outdoorTime || 'early_morning',
      hasAirPurifier: userProfile.hasAirPurifier,
      hasAc: userProfile.hasAc,
      healthSensitivity: userProfile.healthSensitivity || 'none',
      wakeUpTime: userProfile.wakeUpTime || '06:30',
      sleepTime: userProfile.sleepTime || '22:30'
    },
    location: options.location || { name: 'Current Location', region: 'Region' },
    timestamp: options.timestamp || new Date().toISOString()
  };

  // 3. Evaluate applicable decision rules
  const applicableRules = DECISION_RULES
    .filter(rule => {
      try {
        return rule.applies(context);
      } catch (err) {
        console.error(`Error evaluating rule ${rule.id}:`, err);
        return false;
      }
    })
    .sort((a, b) => b.priority - a.priority);

  // Group recommendations by domain
  const recommendationsByDomain = {};
  const explainableList = [];
  const safetyFloorRules = [];

  for (const rule of applicableRules) {
    if (!recommendationsByDomain[rule.domain]) {
      const rec = rule.generateRecommendation(context);
      const fullRec = {
        ruleId: rule.id,
        domain: rule.domain,
        priority: rule.priority,
        action: rec.action,
        reason: rec.reason,
        alternative: rec.alternative,
        expectedImpact: rec.expectedImpact,
        safetyFloor: Boolean(rec.safetyFloor),
        tag: rec.tag || 'Recommendation'
      };

      recommendationsByDomain[rule.domain] = fullRec;
      explainableList.push(fullRec);

      if (fullRec.safetyFloor) {
        safetyFloorRules.push({
          ruleId: fullRec.ruleId,
          domain: fullRec.domain,
          constraint: fullRec.action
        });
      }
    }
  }

  // 4. Synthesize Dashboard Precaution Cards
  const exerciseRec = recommendationsByDomain['exercise'] || recommendationsByDomain['data_fallback'];
  const commuteRec = recommendationsByDomain['commute'] || recommendationsByDomain['data_fallback'];
  const indoorRec = recommendationsByDomain['indoor'] || recommendationsByDomain['data_fallback'];
  const ventilationRec = recommendationsByDomain['ventilation'] || recommendationsByDomain['data_fallback'];

  const precautionCards = [
    {
      id: 'precaution-mask',
      title: 'Outdoor Masking',
      category: 'Mask Advisory',
      status: aqiResult.cautionLevel >= 5
        ? 'N95 / FFP2 Mandatory'
        : aqiResult.cautionLevel === 4
        ? 'N95 Strongly Advised'
        : aqiResult.cautionLevel === 3
        ? 'Mask on Heavy Traffic Roads'
        : aqiResult.status === 'MISSING'
        ? 'Precautionary on Dusty Roads'
        : 'Mask Optional',
      action: commuteRec.action,
      reason: commuteRec.reason,
      alternative: commuteRec.alternative,
      severity: aqiResult.severity
    },
    {
      id: 'precaution-ventilation',
      title: 'Indoor Ventilation',
      category: 'Airflow Protocol',
      status: ventilationRec.tag,
      action: ventilationRec.action,
      reason: ventilationRec.reason,
      alternative: ventilationRec.alternative,
      severity: aqiResult.severity
    },
    {
      id: 'precaution-exercise',
      title: 'Physical Exercise',
      category: 'Conditioning',
      status: exerciseRec.tag,
      action: exerciseRec.action,
      reason: exerciseRec.reason,
      alternative: exerciseRec.alternative,
      severity: aqiResult.severity
    },
    {
      id: 'precaution-indoor',
      title: 'Home Air Setup',
      category: 'Facility Care',
      status: indoorRec.tag,
      action: indoorRec.action,
      reason: indoorRec.reason,
      alternative: indoorRec.alternative,
      severity: aqiResult.severity
    }
  ];

  // 5. Structure Stage 3 Gemini AI Context Payload
  // Prepares the exact schema needed when Google Gemini is integrated
  const geminiContext = {
    readyForGemini: true,
    engineVersion: '2.0.0-cpcb',
    safetyFloorEnforced: true,
    safetyFloorRules: safetyFloorRules,
    contextSummary: {
      userName: context.profile.name,
      location: context.location.name,
      aqi: aqiResult.aqi,
      aqiCategory: aqiResult.category,
      aqiStatus: aqiResult.status,
      cautionLevel: aqiResult.cautionLevel,
      lifestyle: context.profile.lifestyle,
      commuteMode: context.profile.commuteType,
      hasAirPurifier: context.profile.hasAirPurifier,
      healthSensitivity: context.profile.healthSensitivity
    },
    allowedModifications: [
      'conversational_tone',
      'calendar_time_alignment',
      'specific_indoor_workout_drills',
      'low_smoke_cooking_recipes'
    ],
    disallowedModifications: [
      'never_allow_outdoor_running_in_severe_smog',
      'never_claim_cloth_mask_filters_pm25',
      'never_claim_houseplants_replace_hepa'
    ]
  };

  return {
    aqiResult,
    overallAdvisory: aqiResult.healthImpact,
    precautionCards,
    recommendationsByDomain,
    explainableList,
    geminiContext
  };
}
