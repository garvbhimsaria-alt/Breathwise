/**
 * BreatheWise Decision Rules
 * 
 * Transparent, deterministic rule definitions for personalized air-quality recommendations.
 * Every rule produces an explainable recommendation with a structured schema:
 * - action: Primary recommendation
 * - reason: Atmospheric and physiological justification
 * - alternative: Practical alternative if primary action is infeasible
 * - expectedImpact: Defensible health or exposure mitigation benefit
 * - safetyFloor: Critical health boundary that AI explanations must not violate
 */

export const DECISION_RULES = [
  // =========================================================================
  // DOMAIN: DATA AVAILABILITY & FRESHNESS FALLBACKS
  // =========================================================================
  {
    id: 'RULE_DATA_UNAVAILABLE',
    domain: 'data_fallback',
    priority: 100,
    applies: (ctx) => !ctx.aqiResult.valid || ctx.aqiResult.status === 'MISSING',
    generateRecommendation: (ctx) => ({
      action: 'Apply precautionary winter smog routines while sensor data is offline.',
      reason: 'No reliable live air quality reading is currently obtainable for your area. We do not invent sensor numbers or pretend to know ambient pollution levels.',
      alternative: 'Observe local visibility: if haze, vehicle smell, or burning odor is noticeable, treat conditions as Poor and keep physical workouts indoors.',
      expectedImpact: 'Prevents inadvertent high-particulate exposure during unmonitored winter smog inversions without causing undue disruption.',
      safetyFloor: true,
      tag: 'Caution • Data Offline'
    })
  },
  {
    id: 'RULE_DATA_STALE',
    domain: 'data_fallback',
    priority: 90,
    applies: (ctx) => ctx.aqiResult.status === 'STALE',
    generateRecommendation: (ctx) => ({
      action: 'Use the last recorded reading with heightened caution, as conditions may have shifted.',
      reason: `The last available reading for your station was recorded ${ctx.aqiResult.lastUpdatedText}. In urban winter conditions, boundary layer inversion can shift AQI rapidly within 1 to 2 hours.`,
      alternative: 'Check whether atmospheric visibility has changed. If visible haze has thickened, assume higher ground-level particulate density.',
      expectedImpact: 'Accounts for temporal atmospheric volatility rather than relying blindly on outdated readings.',
      safetyFloor: false,
      tag: 'Notice • Outdated Data'
    })
  },

  // =========================================================================
  // DOMAIN: PHYSICAL EXERCISE & MOVEMENT
  // =========================================================================
  {
    id: 'RULE_EXERCISE_IMPROVING',
    domain: 'exercise',
    priority: 85,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.trend === 'improving' && ctx.aqiResult.cautionLevel <= 3,
    generateRecommendation: (ctx) => ({
      action: 'Air quality has improved — safe to resume outdoor running or park activities.',
      reason: `Ambient levels have dropped significantly compared to earlier readings (now ${ctx.aqiResult.category}, AQI ${ctx.aqiResult.aqi}). Atmospheric mixing has dispersed morning surface stagnation.`,
      alternative: 'If you still feel throat sensitivity, start with a brisk walk before full aerobic sprinting.',
      expectedImpact: 'Allows you to enjoy the physiological and psychological benefits of outdoor movement without prolonged restrictions.',
      safetyFloor: false,
      tag: 'Condition Improved • Outdoor Safe'
    })
  },
  {
    id: 'RULE_EXERCISE_GOOD',
    domain: 'exercise',
    priority: 70,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel <= 2,
    generateRecommendation: (ctx) => {
      const isRunner = ctx.profile.exerciseHabit === 'morning_runner' || ctx.profile.exerciseHabit === 'evening_runner';
      return {
        action: isRunner
          ? 'Enjoy unrestricted outdoor running, cycling, or athletic conditioning.'
          : 'Great conditions for an outdoor walk or open-air recreation.',
        reason: `Air quality is ${ctx.aqiResult.category} (AQI ${ctx.aqiResult.aqi}). Particulate and gaseous pollutants meet clean protective guidelines with zero ground-level trapping.`,
        alternative: 'If exercising indoors, keep windows wide open for natural fresh air exchange.',
        expectedImpact: 'Maximizes lung vital capacity, cellular oxygenation, and aerobic endurance with zero particulate burden on bronchial tissues.',
        safetyFloor: false,
        tag: 'Optimal Air • Unrestricted'
      };
    }
  },
  {
    id: 'RULE_EXERCISE_MODERATE_CAUTION',
    domain: 'exercise',
    priority: 70,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel === 3,
    generateRecommendation: (ctx) => {
      const isSensitive = ctx.profile.healthSensitivity && ctx.profile.healthSensitivity !== 'none';
      return {
        action: isSensitive
          ? 'Moderate your outdoor workout duration or shift to an indoor facility.'
          : 'Outdoor exercise is safe in green parks. Steer clear of arterial roads.',
        reason: `Air quality is ${ctx.aqiResult.category} (AQI ${ctx.aqiResult.aqi}). While acceptable for healthy adults, roadside traffic creates localized pockets of dust and exhaust. Sensitive airways may experience mild irritation.`,
        alternative: 'Switch high-intensity outdoor sprints to an indoor bodyweight or yoga session.',
        expectedImpact: 'Preserves your training schedule while reducing exposure to acute roadside traffic plumes.',
        safetyFloor: false,
        tag: 'Moderate Caution'
      };
    }
  },
  {
    id: 'RULE_EXERCISE_POOR_INDOOR_SHIFT',
    domain: 'exercise',
    priority: 80,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel === 4,
    generateRecommendation: (ctx) => ({
      action: 'Shift strenuous aerobic exercise indoors. Replace outdoor runs with home conditioning or treadmill.',
      reason: `Air quality is Poor (AQI ${ctx.aqiResult.aqi}). During vigorous outdoor running, your respiratory minute volume increases by 10x to 20x. This bypasses nasal filtration and pulls microscopic PM2.5 deep into lung alveoli.`,
      alternative: 'A 35-minute indoor session (bodyweight circuits, core, resistance bands) with windows closed.',
      expectedImpact: 'Avoids heavy micro-particulate inhalation during peak smog hours while keeping cardiovascular fitness on track.',
      safetyFloor: true,
      tag: 'Smog Alert • Move Indoors'
    })
  },
  {
    id: 'RULE_EXERCISE_SEVERE_CANCEL',
    domain: 'exercise',
    priority: 85,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel >= 5,
    generateRecommendation: (ctx) => ({
      action: 'Strictly avoid all outdoor exercise and heavy physical exertion. Keep movement gentle and indoors.',
      reason: `Air quality is ${ctx.aqiResult.category} (AQI ${ctx.aqiResult.aqi}). Particulate concentrations are dangerous. Heavy breathing outdoors triggers acute pulmonary oxidative stress, systemic vascular inflammation, and bronchial spasms.`,
      alternative: 'Gentle indoor stretching, restorative mobility, or foam rolling in a room with air filtration.',
      expectedImpact: 'Directly protects cardiac and respiratory pathways from hazardous toxic aerosols during emergency smog levels.',
      safetyFloor: true,
      tag: 'Health Alert • Zero Outdoor Exertion'
    })
  },

  // =========================================================================
  // DOMAIN: ESSENTIAL COMMUTING & TRANSIT PRECAUTIONS
  // =========================================================================
  {
    id: 'RULE_COMMUTE_GOOD',
    domain: 'commute',
    priority: 60,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel <= 2,
    generateRecommendation: (ctx) => {
      const mode = ctx.profile.commuteType || 'metro';
      return {
        action: mode === 'walking' || mode === 'bike'
          ? 'Ideal conditions for walking or cycling your commute. No mask required.'
          : `Enjoy a normal commute via ${mode}. Vehicle windows may remain open.`,
        reason: 'Ambient particulate levels are within protective thresholds. Tailpipe exhaust disperses rapidly into clear air.',
        alternative: 'Consider walking or cycling part of your route to incorporate active travel into your day.',
        expectedImpact: 'Zero particulate exposure risk while reducing carbon footprint and supporting low-emission transit.',
        safetyFloor: false,
        tag: 'Clean Commute'
      };
    }
  },
  {
    id: 'RULE_COMMUTE_MODERATE',
    domain: 'commute',
    priority: 60,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel === 3,
    generateRecommendation: (ctx) => {
      const mode = ctx.profile.commuteType || 'metro';
      return {
        action: mode === 'walking' || mode === 'bike'
          ? 'Select interior residential roads and tree-lined paths over congested bus avenues.'
          : mode === 'car'
          ? 'Roll windows up when idling in heavy traffic or bumper-to-bumper intersections.'
          : 'Standard public transit travel. Keep an N95 mask handy if waiting at open-air bus stops.',
        reason: 'Traffic intersections experience localized accumulation of diesel soot and nitrogen dioxide during peak hours.',
        alternative: 'Travel slightly before or after peak rush hour to avoid standing in slow-moving traffic queues.',
        expectedImpact: 'Avoids sudden exposure spikes to concentrated roadside vehicle plumes.',
        safetyFloor: false,
        tag: 'Roadside Caution'
      };
    }
  },
  {
    id: 'RULE_COMMUTE_POOR_TO_SEVERE',
    domain: 'commute',
    priority: 75,
    applies: (ctx) => ctx.aqiResult.valid && ctx.aqiResult.cautionLevel >= 4,
    generateRecommendation: (ctx) => {
      const mode = ctx.profile.commuteType || 'metro';
      const isSevere = ctx.aqiResult.cautionLevel >= 5;

      if (mode === 'car') {
        return {
          action: 'Toggle Cabin Air Recirculation ON throughout your drive. Keep all windows firmly closed.',
          reason: 'Switching car AC from fresh intake to recirculation prevents drawing roadside exhaust into the cabin, reducing in-vehicle PM2.5 levels by 75% to 90%.',
          alternative: 'Wear an N95 mask inside the car if your vehicle cabin filter is unserviced or over a year old.',
          expectedImpact: 'Blocks direct intrusion of diesel particulate matter (DPM) and toxic exhaust plumes.',
          safetyFloor: true,
          tag: 'Recirculation ON'
        };
      }

      if (mode === 'metro') {
        return {
          action: 'Wear a certified N95/FFP2 mask on platforms and access walkways. Metro trains provide sealed transit.',
          reason: 'Underground rail cars maintain active filtered ventilation, but open-air above-ground stations remain exposed to ambient winter smog.',
          alternative: 'Ensure the nose clip of your N95 mask is pinched securely against the bridge of your nose for a leak-free seal.',
          expectedImpact: 'Leverages the cleanest mass transit mode while protecting against platform exposure spikes.',
          safetyFloor: true,
          tag: 'N95 on Platforms'
        };
      }

      if (mode === 'bus') {
        return {
          action: 'Wear a well-fitted N95 mask throughout your bus journey. Keep bus windows closed if in an AC bus.',
          reason: 'Bus corridors concentrate high volumes of diesel particulate emissions that enter open passenger cabins.',
          alternative: 'If an underground metro connection is available for part of the route, consider switching to reduce road-level exposure.',
          expectedImpact: 'Significantly lowers direct inhalation of combustion soot during congested travel.',
          safetyFloor: true,
          tag: 'N95 in Transit'
        };
      }

      // Walking or Two-Wheeler (Bike / Motorcycle)
      return {
        action: isSevere
          ? 'Wear a certified N95/FFP2 mask tightly sealed. If feasible, consider shifting to closed public transit (Metro).'
          : 'Wear a certified N95 mask with a tight perimeter seal. Choose secondary residential streets rather than following heavy diesel trucks.',
        reason: 'Cloth and surgical masks do not seal against microscopic PM2.5 particles. Two-wheelers and pedestrians sit directly in the vehicle tailpipe emission plume.',
        alternative: 'Carpooling in a vehicle with AC recirculation or using public transit cuts exposure significantly compared to an open two-wheeler.',
        expectedImpact: 'Provides the only verifiable physical and electrostatic barrier against fine particulates during road transit.',
        safetyFloor: true,
        tag: 'N95 Mask Mandatory'
      };
    }
  },

  // =========================================================================
  // DOMAIN: INDOOR AIR & PURIFIER GUIDANCE (AFFORDABLE ALTERNATIVES)
  // =========================================================================
  {
    id: 'RULE_INDOOR_WITH_PURIFIER',
    domain: 'indoor',
    priority: 65,
    applies: (ctx) => ctx.profile.hasAirPurifier === true,
    generateRecommendation: (ctx) => {
      const isElevated = ctx.aqiResult.valid && ctx.aqiResult.cautionLevel >= 4;
      return {
        action: isElevated
          ? 'Run air purifier continuously on auto or medium mode. Place it in the primary living space or bedroom, at least 3 feet away from walls.'
          : 'Run air purifier on silent/low mode during sleep; turn off when outdoor air is clean and windows are open.',
        reason: 'True HEPA (H13) filters mechanically capture 99.97% of particles down to 0.3 microns. Positioning away from walls ensures uninhibited 360-degree air intake.',
        alternative: 'Run the purifier on High for 20 minutes before bedtime, then switch to quiet night mode.',
        expectedImpact: 'Maintains indoor PM2.5 levels at 70% to 85% below outdoor ambient smog.',
        safetyFloor: false,
        tag: 'HEPA Active'
      };
    }
  },
  {
    id: 'RULE_INDOOR_NO_PURIFIER',
    domain: 'indoor',
    priority: 65,
    applies: (ctx) => ctx.profile.hasAirPurifier !== true,
    generateRecommendation: (ctx) => ({
      action: 'Implement affordable indoor source control: eliminate incense/coils, damp-mop floors, and place damp towels along exterior door gaps.',
      reason: 'When mechanical filtration is not present, preventing indoor dust resuspension and stopping outdoor draft infiltration is your most effective defense.',
      alternative: 'Assemble an economical Corsi-Rosenthal box using a standard 20-inch box fan and MERV-13 furnace filters.',
      expectedImpact: 'Reduces indoor particulate intrusion and stops settled dust resuspension. Note: Affordable measures reduce exposure significantly, but do not provide the continuous high-volume extraction of a certified True HEPA appliance.',
      safetyFloor: false,
      tag: 'Affordable Defense'
    })
  },

  // =========================================================================
  // DOMAIN: VENTILATION TIMING (DIURNAL INVERSION AWARENESS)
  // =========================================================================
  {
    id: 'RULE_VENTILATION_TIMING',
    domain: 'ventilation',
    priority: 70,
    applies: (ctx) => true, // Evaluates across all AQI levels
    generateRecommendation: (ctx) => {
      if (!ctx.aqiResult.valid || ctx.aqiResult.cautionLevel >= 5) {
        return {
          action: 'Keep exterior windows and balcony doors firmly closed throughout the day.',
          reason: 'Outdoor PM2.5 is at hazardous levels. Opening windows for even 10 minutes will flood indoor rooms with fine soot that clings to fabrics.',
          alternative: 'Keep internal room doors ajar to balance indoor carbon dioxide without drawing contaminated exterior smog.',
          expectedImpact: 'Maintains an indoor particle envelope far cleaner than the surrounding ambient atmosphere.',
          safetyFloor: true,
          tag: 'Windows Sealed'
        };
      }

      if (ctx.aqiResult.cautionLevel === 4) {
        return {
          action: 'Restrict window opening strictly to a brief 15–20 minute cross-draft between 1:30 PM and 2:15 PM.',
          reason: 'Solar heating peaks in the early afternoon, breaking the ground-level thermal inversion layer and dispersing some surface contaminants. This is your cleanest window to flush stale indoor CO2.',
          alternative: 'Open only courtyard-facing windows rather than street-facing windows.',
          expectedImpact: 'Flushes accumulated carbon dioxide and indoor VOCs without trapping dense morning or evening smog.',
          safetyFloor: false,
          tag: 'Midday Window (15m)'
        };
      }

      if (ctx.aqiResult.cautionLevel === 3) {
        return {
          action: 'Open opposite windows for 30–45 minutes during midday (11:30 AM – 1:30 PM).',
          reason: 'Midday wind and solar warmth aid atmospheric mixing, making midday the cleanest part of the diurnal cycle.',
          alternative: 'Close windows facing busy roads during morning (8–10 AM) and evening (6–8 PM) traffic rush.',
          expectedImpact: 'Refreshes indoor oxygen levels while keeping roadside dust intake to a minimum.',
          safetyFloor: false,
          tag: 'Controlled Midday Flush'
        };
      }

      // Good or Satisfactory
      return {
        action: 'Open opposite windows and balcony doors wide for full natural cross-ventilation (10 AM – 2:30 PM).',
        reason: 'Outdoor air is clean and meets safe respiratory guidelines. Natural airflow thoroughly expels indoor cooking byproducts, moisture, and CO2.',
        alternative: 'Keep windows cracked throughout the day for continuous fresh airflow.',
        expectedImpact: 'Reduces indoor CO2 below 500 ppm, preventing midday brain fog and fatigue.',
        safetyFloor: false,
        tag: 'Full Natural Flush'
      };
    }
  },

  // =========================================================================
  // DOMAIN: WORK-FROM-HOME (WFH) & LIFESTYLE ADAPTATIONS
  // =========================================================================
  {
    id: 'RULE_LIFESTYLE_WFH',
    domain: 'lifestyle',
    priority: 60,
    applies: (ctx) => ctx.profile.lifestyle === 'wfh',
    generateRecommendation: (ctx) => {
      const isElevated = ctx.aqiResult.valid && ctx.aqiResult.cautionLevel >= 4;
      return {
        action: isElevated
          ? 'Establish a single designated workspace room with closed windows. Position your air filter near your desk.'
          : 'Work in a well-ventilated room with open courtyard windows to maintain high cognitive alertness.',
        reason: 'Working from home allows complete control over your breathing zone and avoids the peak commute pollution window entirely.',
        alternative: 'Take a 5-minute indoor mobility stretch break every 60 minutes to maintain circulation without needing outdoor walks.',
        expectedImpact: 'Eliminates travel-related exhaust exposure and optimizes indoor cognitive performance.',
        safetyFloor: false,
        tag: 'Home Office Optimized'
      };
    }
  }
];
