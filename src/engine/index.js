/**
 * BreatheWise Decision Engine — Main Export Hub
 * 
 * Central entry point for AQI classification, rule-based recommendations,
 * dynamic routine generation, and sustainable transit calculations.
 */

export { 
  classifyAqi, 
  CPCB_AQI_THRESHOLDS, 
  STALE_DATA_THRESHOLD_MS 
} from './aqiClassifier.js';

export { 
  DECISION_RULES 
} from './decisionRules.js';

export { 
  generateRecommendations 
} from './recommendationEngine.js';

export { 
  generateDynamicRoutine 
} from './routineGenerator.js';

export { 
  calculateCommuteImpact, 
  compareAllCommuteModes, 
  TRANSIT_EMISSION_BENCHMARKS 
} from './impactCalculator.js';
