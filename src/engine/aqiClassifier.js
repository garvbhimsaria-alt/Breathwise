/**
 * BreatheWise AQI Classifier
 * 
 * Implements India's Official Central Pollution Control Board (CPCB)
 * National Air Quality Index (NAQI) categories, thresholds, and health breakpoints.
 * 
 * Reference: Ministry of Environment, Forest & Climate Change (MoEFCC) / CPCB.
 */

// Authoritative CPCB AQI Categories & Threshold Breakpoints
export const CPCB_AQI_THRESHOLDS = [
  {
    key: 'GOOD',
    label: 'Good',
    min: 0,
    max: 50,
    severity: 'safe',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#065F46',
    healthImpact: 'Minimal health impact. Air quality is clean and poses little to no risk.',
    pm25Range: '0 – 30 µg/m³',
    pm10Range: '0 – 50 µg/m³',
    outdoorSafe: true,
    maskRequired: false
  },
  {
    key: 'SATISFACTORY',
    label: 'Satisfactory',
    min: 51,
    max: 100,
    severity: 'low',
    color: '#84CC16',
    bgColor: '#F7FEE7',
    borderColor: '#D9F99D',
    textColor: '#365314',
    healthImpact: 'Minor breathing discomfort may develop in unusually sensitive individuals.',
    pm25Range: '31 – 60 µg/m³',
    pm10Range: '51 – 100 µg/m³',
    outdoorSafe: true,
    maskRequired: false
  },
  {
    key: 'MODERATE',
    label: 'Moderate',
    min: 101,
    max: 200,
    severity: 'moderate',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#92400E',
    healthImpact: 'Breathing discomfort to people with lung disease (such as asthma) and heart conditions, children, and older adults.',
    pm25Range: '61 – 90 µg/m³',
    pm10Range: '101 – 250 µg/m³',
    outdoorSafe: 'caution',
    maskRequired: false
  },
  {
    key: 'POOR',
    label: 'Poor',
    min: 201,
    max: 300,
    severity: 'high',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    textColor: '#9A3412',
    healthImpact: 'Breathing discomfort to most people on prolonged outdoor exposure. Noticeable discomfort in heart and lung disease patients.',
    pm25Range: '91 – 120 µg/m³',
    pm10Range: '251 – 350 µg/m³',
    outdoorSafe: false,
    maskRequired: true
  },
  {
    key: 'VERY_POOR',
    label: 'Very Poor',
    min: 301,
    max: 400,
    severity: 'very_high',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
    healthImpact: 'Respiratory illness on prolonged exposure. Effects significantly more pronounced in people with existing lung and heart ailments.',
    pm25Range: '121 – 250 µg/m³',
    pm10Range: '351 – 430 µg/m³',
    outdoorSafe: false,
    maskRequired: true
  },
  {
    key: 'SEVERE',
    label: 'Severe',
    min: 401,
    max: 500,
    severity: 'emergency',
    color: '#7F1D1D',
    bgColor: '#FEF2F2',
    borderColor: '#991B1B',
    textColor: '#7F1D1D',
    healthImpact: 'Affects healthy individuals and seriously impacts those with existing medical conditions. Symptoms experienced even during light outdoor activity.',
    pm25Range: '250+ µg/m³',
    pm10Range: '430+ µg/m³',
    outdoorSafe: false,
    maskRequired: true
  }
];

// Default Stale Data Age Limit: 120 minutes (2 hours)
export const STALE_DATA_THRESHOLD_MS = 2 * 60 * 60 * 1000;

/**
 * Validates, checks freshness, and classifies an AQI input according to official CPCB standards.
 * 
 * @param {number|string|null|undefined} rawAqi - The raw AQI value
 * @param {Object} [options={}] - Optional metadata (timestamp, isDemo, previousAqi)
 * @returns {Object} Classified AQI result with validated status, category, and metadata
 */
export function classifyAqi(rawAqi, options = {}) {
  const {
    timestamp = null,
    isDemo = true,
    previousAqi = null
  } = options;

  // 1. Check for Missing Data
  if (rawAqi === null || rawAqi === undefined || rawAqi === '') {
    return {
      status: 'MISSING',
      valid: false,
      aqi: null,
      categoryKey: 'MISSING',
      category: 'Data Unavailable',
      severity: 'unknown',
      color: '#6B878D',
      bgColor: '#F3F8F6',
      borderColor: '#E2ECE9',
      textColor: '#102E35',
      healthImpact: 'Air quality reading is currently unavailable for this station or sensor. Reliable exposure cannot be measured.',
      shortNotice: 'AQI Data Unavailable',
      isDemo: Boolean(isDemo),
      isLive: false,
      isStale: false,
      lastUpdatedText: 'Unknown',
      dataConfidence: 'none',
      cautionLevel: 0
    };
  }

  // 2. Validate numeric input
  const numericAqi = Number(rawAqi);
  if (Number.isNaN(numericAqi) || numericAqi < 0 || numericAqi > 1000) {
    return {
      status: 'INVALID',
      valid: false,
      aqi: null,
      rawInput: rawAqi,
      categoryKey: 'INVALID',
      category: 'Invalid Reading',
      severity: 'unknown',
      color: '#6B878D',
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
      textColor: '#991B1B',
      healthImpact: `Received invalid sensor value (${String(rawAqi)}). Real AQI values must fall between 0 and 500 (or up to 1000 for emergency hazard sensors).`,
      shortNotice: 'Sensor Value Error',
      isDemo: Boolean(isDemo),
      isLive: false,
      isStale: false,
      lastUpdatedText: 'Invalid',
      dataConfidence: 'none',
      cautionLevel: 0
    };
  }

  // 3. Freshness / Stale Data Check
  let isStale = false;
  let lastUpdatedText = 'Recent';
  if (timestamp) {
    const ageMs = Date.now() - new Date(timestamp).getTime();
    if (!Number.isNaN(ageMs) && ageMs > STALE_DATA_THRESHOLD_MS) {
      isStale = true;
      const hoursAgo = Math.floor(ageMs / (1000 * 60 * 60));
      lastUpdatedText = `${hoursAgo} hours ago (Outdated)`;
    } else if (!Number.isNaN(ageMs)) {
      const minutesAgo = Math.max(1, Math.floor(ageMs / (1000 * 60)));
      lastUpdatedText = `${minutesAgo} mins ago`;
    }
  }

  // 4. Trend Evaluation (Improving vs Rising vs Stable)
  let trend = 'stable';
  if (typeof previousAqi === 'number' && !Number.isNaN(previousAqi)) {
    if (numericAqi < previousAqi - 15) {
      trend = 'improving';
    } else if (numericAqi > previousAqi + 15) {
      trend = 'worsening';
    }
  }

  // 5. Match against official CPCB Breakpoints
  let matchedTier = CPCB_AQI_THRESHOLDS[0];
  if (numericAqi > 400) {
    matchedTier = CPCB_AQI_THRESHOLDS[5]; // Severe
  } else {
    for (let i = 0; i < CPCB_AQI_THRESHOLDS.length; i++) {
      const tier = CPCB_AQI_THRESHOLDS[i];
      if (numericAqi >= tier.min && numericAqi <= tier.max) {
        matchedTier = tier;
        break;
      }
    }
  }

  const cautionLevelMap = {
    GOOD: 1,
    SATISFACTORY: 2,
    MODERATE: 3,
    POOR: 4,
    VERY_POOR: 5,
    SEVERE: 6
  };

  return {
    status: isStale ? 'STALE' : 'VALID',
    valid: true,
    aqi: Math.round(numericAqi),
    categoryKey: matchedTier.key,
    category: matchedTier.label,
    severity: matchedTier.severity,
    color: matchedTier.color,
    bgColor: matchedTier.bgColor,
    borderColor: matchedTier.borderColor,
    textColor: matchedTier.textColor,
    healthImpact: matchedTier.healthImpact,
    shortNotice: isStale ? `Outdated Reading (${matchedTier.label})` : matchedTier.label,
    pm25Range: matchedTier.pm25Range,
    pm10Range: matchedTier.pm10Range,
    outdoorSafe: matchedTier.outdoorSafe,
    maskRequired: matchedTier.maskRequired,
    isDemo: Boolean(isDemo),
    isLive: !isDemo,
    isStale: isStale,
    lastUpdatedText: lastUpdatedText,
    dataConfidence: isStale ? 'low' : (isDemo ? 'moderate' : 'high'),
    trend: trend,
    cautionLevel: cautionLevelMap[matchedTier.key] || 1
  };
}
