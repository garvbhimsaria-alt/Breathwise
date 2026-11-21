// BreatheWise Mock Data & Knowledge Base
// All data is clearly labelled as sample/demonstration data until live providers are integrated.

export const SAMPLE_CITIES = [
  {
    id: 'delhi',
    name: 'Delhi NCR',
    region: 'North India',
    aqi: 284,
    pm25: 234.2,
    pm10: 382.5,
    no2: 68.4,
    o3: 24.1,
    temp: 19,
    humidity: 68,
    primaryPollutant: 'PM2.5',
    lastUpdated: '12 minutes ago',
    dataSource: 'Central Pollution Monitoring Net (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'rising'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'West Coast',
    aqi: 124,
    pm25: 45.1,
    pm10: 98.6,
    no2: 38.0,
    o3: 31.5,
    temp: 29,
    humidity: 74,
    primaryPollutant: 'PM10',
    lastUpdated: '22 minutes ago',
    dataSource: 'Coastal Air Quality Station (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'stable'
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    region: 'South India',
    aqi: 46,
    pm25: 11.8,
    pm10: 32.4,
    no2: 17.5,
    o3: 22.0,
    temp: 23,
    humidity: 58,
    primaryPollutant: 'O3',
    lastUpdated: '8 minutes ago',
    dataSource: 'Urban Air Observatory (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'improving'
  },
  {
    id: 'newyork',
    name: 'New York City',
    region: 'East Coast, US',
    aqi: 68,
    pm25: 20.4,
    pm10: 44.1,
    no2: 29.2,
    o3: 36.8,
    temp: 12,
    humidity: 52,
    primaryPollutant: 'PM2.5',
    lastUpdated: '18 minutes ago',
    dataSource: 'Metro Environmental Bureau (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'improving'
  },
  {
    id: 'london',
    name: 'London',
    region: 'United Kingdom',
    aqi: 36,
    pm25: 8.7,
    pm10: 19.3,
    no2: 25.1,
    o3: 18.4,
    temp: 10,
    humidity: 80,
    primaryPollutant: 'NO2',
    lastUpdated: '34 minutes ago',
    dataSource: 'City Air Network (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'stable'
  },
  {
    id: 'beijing',
    name: 'Beijing',
    region: 'East Asia',
    aqi: 182,
    pm25: 114.5,
    pm10: 205.0,
    no2: 54.0,
    o3: 19.2,
    temp: 6,
    humidity: 44,
    primaryPollutant: 'PM2.5',
    lastUpdated: '15 minutes ago',
    dataSource: 'Regional Atmospheric Station (Demo Archive)',
    dataType: 'Sample Data',
    trend: 'rising'
  }
];

// Standard AQI Demonstration Scenarios for testing and interactive adaptation
export const SCENARIO_PRESETS = [
  {
    id: 'good',
    label: 'Good',
    aqi: 35,
    category: 'Good',
    pm25: 8.5,
    pm10: 18.0,
    no2: 12.0,
    temp: 22,
    humidity: 55,
    primaryPollutant: 'O3',
    color: '#10B981',
    desc: 'Pristine Air • Unrestricted Outdoors'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    aqi: 85,
    category: 'Moderate',
    pm25: 28.5,
    pm10: 65.0,
    no2: 32.0,
    temp: 24,
    humidity: 60,
    primaryPollutant: 'PM10',
    color: '#F59E0B',
    desc: 'Acceptable Air • Caution on Roads'
  },
  {
    id: 'poor',
    label: 'Poor',
    aqi: 165,
    category: 'Unhealthy',
    pm25: 88.0,
    pm10: 162.0,
    no2: 54.0,
    temp: 18,
    humidity: 65,
    primaryPollutant: 'PM2.5',
    color: '#EF4444',
    desc: 'Unhealthy Smog • Shift Cardio Indoors'
  },
  {
    id: 'severe',
    label: 'Severe',
    aqi: 310,
    category: 'Hazardous / Severe',
    pm25: 265.0,
    pm10: 420.0,
    no2: 78.0,
    temp: 15,
    humidity: 72,
    primaryPollutant: 'PM2.5',
    color: '#7F1D1D',
    desc: 'Health Alert • Strict Indoor Enclosure'
  }
];

export const getAqiCategory = (aqi) => {
  if (aqi <= 50) {
    return {
      category: 'Good',
      severity: 'safe',
      color: '#10B981',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      textColor: '#065F46',
      badgeColor: '#10B981',
      shortDesc: 'Air quality is satisfactory and poses little or no risk.',
      explanation: 'Air quality is considered healthy. Ambient particulate and gas concentrations meet protective guidelines. Ideal for all outdoor recreational activities.',
      maskRecommendation: 'No mask required for general outdoor activity.',
      ventilationAdvice: 'Great time to open windows and let fresh outdoor air flush indoor spaces.',
      outdoorExercise: 'Safe for intense outdoor running, cycling, and workouts.',
      vulnerableGroupNotice: 'No special health warnings for sensitive groups.'
    };
  } else if (aqi <= 100) {
    return {
      category: 'Moderate',
      severity: 'moderate',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#92400E',
      badgeColor: '#D97706',
      shortDesc: 'Air quality is acceptable for most, but unusually sensitive people should take note.',
      explanation: 'Acceptable ambient conditions. A small fraction of people unusually sensitive to ozone or particulate matter may experience mild throat irritation or cough.',
      maskRecommendation: 'Not required for healthy individuals; optional for sensitive individuals on long roadside trips.',
      ventilationAdvice: 'Safe to open windows during midday hours when wind aids air dispersion.',
      outdoorExercise: 'General outdoor workouts are fine. Unusually sensitive individuals can monitor for symptoms.',
      vulnerableGroupNotice: 'People with chronic asthma or COPD should have inhalers accessible.'
    };
  } else if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      severity: 'warning',
      color: '#EA580C',
      bgColor: '#FFF7ED',
      borderColor: '#FED7AA',
      textColor: '#9A3412',
      badgeColor: '#EA580C',
      shortDesc: 'Children, seniors, and people with respiratory or heart conditions may experience effects.',
      explanation: 'Vulnerable individuals face increased risk of respiratory inflammation. The general public is less likely to be noticeably affected, but heavy outdoor exertion is best moderated.',
      maskRecommendation: 'Sensitive individuals should wear well-fitted N95 masks when outside.',
      ventilationAdvice: 'Limit open window ventilation to 15-20 minutes in early afternoon; avoid morning rush hours.',
      outdoorExercise: 'Children and sensitive adults should shift strenuous workouts indoors or reduce duration.',
      vulnerableGroupNotice: 'Asthma sufferers should reduce outdoor time and watch for shortness of breath.'
    };
  } else if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      severity: 'danger',
      color: '#EF4444',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      textColor: '#991B1B',
      badgeColor: '#DC2626',
      shortDesc: 'Everyone may begin to experience health effects; sensitive groups may feel serious effects.',
      explanation: 'Micro-pollutants penetrate deep into lung tissue. Prolonged outdoor exertion causes eye irritation, dry throat, and decreased lung function across healthy populations.',
      maskRecommendation: 'Well-fitted N95 / FFP2 mask strongly advised for anyone spending >15 mins outdoors.',
      ventilationAdvice: 'Keep windows and exterior doors shut. Use recirculating air filtration if available.',
      outdoorExercise: 'Avoid outdoor cardio and running. Replace with home bodyweight exercises or indoor gym.',
      vulnerableGroupNotice: 'High risk for seniors, young children, and respiratory patients. Remain indoors where possible.'
    };
  } else if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      severity: 'severe',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
      textColor: '#5B21B6',
      badgeColor: '#7C3AED',
      shortDesc: 'Health alert: Serious risk of health effects for the entire population.',
      explanation: 'Severe pollution event typical of winter smog and thermal inversion layers. Ambient PM2.5 levels are dangerous. Cellular oxidative stress and respiratory inflammation accelerate rapidly.',
      maskRecommendation: 'N95 / FFP2 mask mandatory for all outdoor exposure. Ensure a tight perimeter seal.',
      ventilationAdvice: 'Do not open windows. Seal doorway drafts and run mechanical HEPA purification continuously.',
      outdoorExercise: 'Strictly avoid all outdoor exercise. Even brisk walking should be minimized.',
      vulnerableGroupNotice: 'Medical warning: High likelihood of respiratory distress triggers. Keep emergency medication ready.'
    };
  } else {
    return {
      category: 'Hazardous / Severe',
      severity: 'emergency',
      color: '#7F1D1D',
      bgColor: '#FEF2F2',
      borderColor: '#991B1B',
      textColor: '#7F1D1D',
      badgeColor: '#7F1D1D',
      shortDesc: 'Health emergency: The entire population is likely to be severely affected.',
      explanation: 'Emergency-tier ambient smog. Heavy toxic aerosol concentration. Avoid all non-essential outdoor activity.',
      maskRecommendation: 'Tight-fitting N95 / FFP3 mask mandatory even for brief outdoor transits.',
      ventilationAdvice: 'Complete building envelope closure. Damp cloth draft barriers recommended at door gaps.',
      outdoorExercise: 'Zero outdoor exertion. Stay in filtered indoor enclosures.',
      vulnerableGroupNotice: 'Absolute health alert for sensitive demographics. Minimize physical exertion.'
    };
  }
};

// Default User Profile for personalization
export const INITIAL_USER_PROFILE = {
  name: 'Alex',
  cityId: 'delhi',
  customCityName: '',
  lifestyle: 'working_professional', // 'student', 'working_professional', 'wfh', 'outdoor_worker'
  commuteType: 'metro', // 'metro', 'bus', 'car', 'bike', 'walking'
  commuteDistanceKm: 12,
  exerciseHabit: 'morning_runner', // 'morning_runner', 'evening_runner', 'gym_indoor', 'walking', 'none'
  outdoorTime: 'early_morning', // 'early_morning', 'morning', 'afternoon', 'evening'
  hasAirPurifier: true, // true, false, 'unsure'
  hasAc: true,
  healthSensitivity: 'mild_asthma', // 'none', 'mild_asthma', 'sensitive_throat', 'senior_household', 'child_at_home'
  hasCompletedOnboarding: true
};

// Generates dynamic daily schedule timeline tailored to 4 distinct AQI scenarios & user profile
export const generatePersonalizedRoutine = (profile, currentAqi) => {
  // Determine 4 distinct tiers: Good, Moderate, Poor, Severe
  let tier = 'good';
  if (currentAqi > 200) {
    tier = 'severe';
  } else if (currentAqi > 100) {
    tier = 'poor';
  } else if (currentAqi > 50) {
    tier = 'moderate';
  } else {
    tier = 'good';
  }

  const hasPurifier = profile.hasAirPurifier === true;
  const isMorningExerciser = profile.exerciseHabit === 'morning_runner' || profile.exerciseHabit === 'walking';
  const isWfh = profile.lifestyle === 'wfh';
  const isStudent = profile.lifestyle === 'student';

  // -------------------------------------------------------------
  // STEP 1: Morning Exercise / Early Habit Adaptation
  // -------------------------------------------------------------
  let step1 = {};
  if (tier === 'good') {
    step1 = {
      id: 'step-1',
      time: '06:15 AM – 07:30 AM',
      title: profile.exerciseHabit === 'none' ? 'Morning Outdoor Refresh Walk' : 'Unrestricted Outdoor Running / Cycling',
      category: 'Exercise & Wellness',
      badge: 'Optimal Window',
      badgeType: 'success',
      icon: 'Activity',
      originalHabit: isMorningExerciser ? 'Outdoor running in local park' : 'Morning wake-up routine',
      recommendation: 'Take full advantage of clean morning conditions for outdoor running, cycling, or brisk park walks. No protective mask required.',
      reasoning: 'Atmospheric particulate levels are within clean WHO guidelines. Morning solar convection and night settling have cleared surface aerosols.',
      practicalAlternative: 'If exercising indoors, keep windows wide open for natural fresh air exchange.',
      expectedBenefit: 'Maximizes lung vital capacity and cardiovascular conditioning with zero pulmonary particulate burden.'
    };
  } else if (tier === 'moderate') {
    step1 = {
      id: 'step-1',
      time: '07:00 AM – 08:00 AM',
      title: profile.exerciseHabit === 'none' ? 'Park Walk on Interior Trails' : 'Outdoor Cardio with Route Caution',
      category: 'Exercise & Wellness',
      badge: 'Caution Near Roads',
      badgeType: 'info',
      icon: 'Activity',
      originalHabit: isMorningExerciser ? 'Outdoor running near neighborhood roads' : 'Morning stroll',
      recommendation: 'Outdoor exercise is safe for most healthy adults. Choose green parks or interior residential loops, staying away from arterial commuter corridors.',
      reasoning: 'Regional air is acceptable, but early morning traffic creates localized plumes of coarse dust and diesel particulates near multi-lane roads.',
      practicalAlternative: profile.healthSensitivity !== 'none'
        ? 'Since your profile flags respiratory sensitivity, reduce high-intensity duration by 20% or switch to an indoor workout.'
        : 'If vehicle exhaust is noticeable along your route, shift to an indoor bodyweight circuit.',
      expectedBenefit: 'Maintains daily cardiovascular fitness while avoiding direct contact with roadside vehicle emissions.'
    };
  } else if (tier === 'poor') {
    step1 = {
      id: 'step-1',
      time: '07:15 AM – 08:00 AM',
      title: 'Adapted Indoor Cardio & Mobility (Replacing Outdoor Run)',
      category: 'Exercise & Wellness',
      badge: 'Smog Alert: Move Indoors',
      badgeType: 'warning',
      icon: 'Activity',
      originalHabit: isMorningExerciser ? 'Morning outdoor run in neighborhood' : 'Morning walk / commute',
      recommendation: 'Shift strenuous aerobic exercise indoors. Replace outdoor jogging with home bodyweight intervals, treadmill, or yoga with windows closed.',
      reasoning: 'Winter thermal inversion traps cold particulate-dense air near ground level. Heavy outdoor breathing increases minute ventilation tenfold, depositing micro-PM2.5 deep into alveoli.',
      practicalAlternative: 'Follow a 35-minute indoor HIIT, core, or resistance band session. If using a gym, verify mechanical filtration is operating.',
      expectedBenefit: 'Avoids inhaling elevated micro-particulates during the morning peak while keeping physical training on schedule.'
    };
  } else {
    // severe
    step1 = {
      id: 'step-1',
      time: '07:30 AM – 08:15 AM',
      title: 'Low-Exertion Indoor Restorative Routine (Zero Outdoor Exertion)',
      category: 'Exercise & Wellness',
      badge: 'Hazard Alert: Zero Outdoor Exertion',
      badgeType: 'alert',
      icon: 'Activity',
      originalHabit: isMorningExerciser ? 'Outdoor running / sports' : 'Morning outdoor activity',
      recommendation: 'Strictly cancel all outdoor exercise and heavy breathing. Complete only gentle indoor stretching, mobility, or restorative yoga in a sealed room.',
      reasoning: 'Severe smog conditions cause acute oxidative stress, rapid airway inflammation, and vascular irritation even during light outdoor walking.',
      practicalAlternative: 'Gentle indoor yoga, foam rolling, and deliberate breathing within a room with door drafts sealed and air filtration running.',
      expectedBenefit: 'Protects cardiac and respiratory pathways from hazardous toxic aerosols during the day’s peak inversion window.'
    };
  }

  // -------------------------------------------------------------
  // STEP 2: Commute & Daily Travel Strategy
  // -------------------------------------------------------------
  let step2 = {};
  if (tier === 'good') {
    step2 = {
      id: 'step-2',
      time: '08:30 AM – 09:30 AM',
      title: isWfh ? 'Morning Work Transition' : 'Active & Low-Emission Commute Window',
      category: 'Commute',
      badge: 'Unrestricted Travel',
      badgeType: 'success',
      icon: 'Compass',
      originalHabit: `Standard ${profile.commuteType || 'transit'} commute (${profile.commuteDistanceKm || 10} km)`,
      recommendation: isWfh
        ? 'Air out your home office workspace with open windows before beginning morning focus work.'
        : (profile.commuteType === 'walking' || profile.commuteType === 'bike'
            ? `Ideal conditions for walking or cycling your ${profile.commuteDistanceKm || 10} km route. No mask required.`
            : `Safe and pleasant commute via ${profile.commuteType}. Open vehicle windows are safe.`),
      reasoning: 'Atmospheric particulate dispersion is active and traffic plumes dilute quickly into clear ambient air.',
      practicalAlternative: 'Consider walking or cycling part of your commute for daily active movement.',
      expectedBenefit: 'Zero smog inhalation risk while supporting personal physical health and low-carbon urban transit.'
    };
  } else if (tier === 'moderate') {
    step2 = {
      id: 'step-2',
      time: '08:30 AM – 09:30 AM',
      title: isWfh ? 'Desk Setup & Gentle Airflow' : 'Standard Commute with Roadside Awareness',
      category: 'Commute',
      badge: 'Roadside Awareness',
      badgeType: 'info',
      icon: 'Compass',
      originalHabit: `Standard ${profile.commuteType || 'transit'} commute (${profile.commuteDistanceKm || 10} km)`,
      recommendation: isWfh
        ? 'Work in a well-ventilated room with open courtyard windows.'
        : (profile.commuteType === 'walking' || profile.commuteType === 'bike'
            ? 'Choose residential side streets and protected cycle paths rather than following busy diesel bus corridors.'
            : 'If driving or cabbing, keep windows closed in stop-and-go jams; on public transit, standard hygiene is sufficient.'),
      reasoning: 'Roadside intersections experience localized accumulation of diesel exhaust particles (DPM) and nitrogen dioxide during peak rush hour.',
      practicalAlternative: 'Have an N95 mask accessible if you encounter unpaved detours, open construction, or high congestion.',
      expectedBenefit: 'Avoids concentrated roadside exhaust clouds without requiring drastic schedule disruptions.'
    };
  } else if (tier === 'poor') {
    step2 = {
      id: 'step-2',
      time: '08:15 AM – 09:15 AM',
      title: isWfh ? 'Home Office Air Shielding' : 'Shielded Transit & N95 Protection',
      category: 'Commute',
      badge: 'N95 Mask Required',
      badgeType: 'warning',
      icon: 'Compass',
      originalHabit: `Standard ${profile.commuteType || 'transit'} commute (${profile.commuteDistanceKm || 10} km)`,
      recommendation: isWfh
        ? 'Keep street-facing windows shut during rush hour. Run a localized air cleaner in your study.'
        : (profile.commuteType === 'walking' || profile.commuteType === 'bike'
            ? 'Switch from walking/cycling to closed-cabin public transit (Metro or AC bus) wearing a certified N95 mask.'
            : 'In car/cab: Toggle Cabin Air Recirculation ON. On public transit: Wear a well-fitted N95 mask throughout platforms.'),
      reasoning: 'Rush hour traffic generates concentrated plumes of soot, fine dust, and nitrogen oxides trapped near breathing level by thermal inversion.',
      practicalAlternative: 'In vehicles, keeping AC on internal recirculation cuts particulate intrusion by 75% to 90% compared to fresh air intake.',
      expectedBenefit: 'Dramatically reduces acute exposure to roadside carcinogens and toxic combustion byproducts.'
    };
  } else {
    // severe
    step2 = {
      id: 'step-2',
      time: '08:00 AM – 09:30 AM',
      title: isWfh ? 'High-Protection Remote Work Day' : 'Emergency Sealed Travel Strategy',
      category: 'Commute',
      badge: 'Emergency Sealed Transit',
      badgeType: 'alert',
      icon: 'Compass',
      originalHabit: `Standard ${profile.commuteType || 'transit'} commute (${profile.commuteDistanceKm || 10} km)`,
      recommendation: isWfh
        ? 'Remain entirely indoors in your designated clean room. Run continuous air cleaning.'
        : (isStudent
            ? 'If campus classes cannot be attended remotely, travel strictly point-to-point via Metro with a tightly sealed N95/FFP3 mask.'
            : 'Minimize all outdoor exposure. Avoid open two-wheelers or walking. Strictly use underground Metro or closed vehicles with AC Recirculation and N95 masks.'),
      reasoning: 'Severe ambient smog causes burning eyes, throat constriction, and microvascular stress within 10 minutes of unprotected roadside exposure.',
      practicalAlternative: profile.lifestyle === 'working_professional'
        ? 'Request flexible remote hours to avoid peak morning ground smog; otherwise travel directly without roadside stops.'
        : 'Postpone non-essential travel until afternoon convection temporarily dilutes surface air.',
      expectedBenefit: 'Prevents severe acute pollutant dosing during the most hazardous commuting hours of the day.'
    };
  }

  // -------------------------------------------------------------
  // STEP 3: Midday Ventilation & Workspace Environment
  // -------------------------------------------------------------
  let step3 = {};
  if (tier === 'good') {
    step3 = {
      id: 'step-3',
      time: '10:00 AM – 02:30 PM',
      title: 'Full Natural Home & Workspace Air Exchange',
      category: 'Indoor Air Quality',
      badge: 'Full Open Air Flush',
      badgeType: 'success',
      icon: 'Wind',
      originalHabit: 'Keeping windows closed or unmanaged',
      recommendation: 'Open opposite windows and balcony doors wide. Allow natural cross-ventilation to thoroughly flush indoor air.',
      reasoning: 'Outdoor air is pristine. Natural airflow expels accumulated indoor carbon dioxide, cooking moisture, and VOCs without introducing exterior contaminants.',
      practicalAlternative: 'Keep windows cracked throughout the workday for continuous oxygen replenishment.',
      expectedBenefit: 'Lowers indoor CO2 below 500 ppm, preventing midday brain fog, headaches, and lethargy.'
    };
  } else if (tier === 'moderate') {
    step3 = {
      id: 'step-3',
      time: '11:30 AM – 01:30 PM',
      title: 'Controlled Midday Ventilation Window',
      category: 'Indoor Air Quality',
      badge: 'Controlled Flush (45m)',
      badgeType: 'info',
      icon: 'Wind',
      originalHabit: 'Keeping windows shut or opening indiscriminately',
      recommendation: 'Open windows for 30–45 minutes during midday solar peak, preferably on courtyard or non-street-facing sides.',
      reasoning: 'Thermal convection breaks morning surface stagnation, making late morning to early afternoon the cleanest atmospheric window of the day.',
      practicalAlternative: 'If outside traffic is audible or dust is visible, limit opening to non-street windows.',
      expectedBenefit: 'Refreshes stale indoor oxygen levels while keeping roadside dust intake to a minimum.'
    };
  } else if (tier === 'poor') {
    step3 = {
      id: 'step-3',
      time: '01:30 PM – 02:00 PM',
      title: 'Strict 15-Minute Strategic Cross-Ventilation',
      category: 'Indoor Air Quality',
      badge: 'Restricted Window (15m)',
      badgeType: 'warning',
      icon: 'Wind',
      originalHabit: 'Keeping windows shut all day',
      recommendation: 'Limit window opening to a quick 15-minute cross-draft at 1:30 PM on non-roadside windows, then immediately reseal.',
      reasoning: 'Solar radiation temporarily dilutes ground-level PM2.5 between 1 PM and 2 PM. This is your only safe window to flush trapped CO2 before evening stagnation.',
      practicalAlternative: hasPurifier
        ? 'Open windows for 15 minutes to flush CO2, then close and run air purifier on High/Turbo for 20 minutes.'
        : 'Keep interior bedroom doors open to circulate air without pulling exterior roadside dust.',
      expectedBenefit: 'Clears cognitive-draining indoor CO2 buildup without trapping high volumes of ambient smog.'
    };
  } else {
    // severe
    step3 = {
      id: 'step-3',
      time: 'All-Day Midday Protocol',
      title: 'Zero Exterior Window Opening — Complete Building Envelope Seal',
      category: 'Indoor Air Quality',
      badge: 'Windows Sealed',
      badgeType: 'alert',
      icon: 'Wind',
      originalHabit: 'Opening windows for air',
      recommendation: 'Keep all exterior windows and doors firmly shut throughout the day. Do not open windows.',
      reasoning: 'Outdoor PM2.5 is at hazardous emergency levels. Opening windows for even 5 minutes will saturate indoor rooms with fine soot that settles onto fabrics.',
      practicalAlternative: hasPurifier
        ? 'Run HEPA air purifiers continuously on auto/medium mode. Use interior ceiling fans for circulation.'
        : 'Use DIY Corsi-Rosenthal box fans and seal door gaps with draft stoppers or damp towels.',
      expectedBenefit: 'Maintains indoor PM2.5 levels at 60% to 80% below the hazardous exterior smog.'
    };
  }

  // -------------------------------------------------------------
  // STEP 4: Evening Transition & Decontamination
  // -------------------------------------------------------------
  let step4 = {};
  if (tier === 'good') {
    step4 = {
      id: 'step-4',
      time: '05:30 PM – 07:00 PM',
      title: 'Evening Leisure & Outdoor Unwind',
      category: 'Home Transition',
      badge: 'Pleasant Evening',
      badgeType: 'success',
      icon: 'ShieldCheck',
      originalHabit: 'Returning indoors directly',
      recommendation: 'Enjoy an evening walk, outdoor sports, or park relaxation. No special decontamination needed upon arriving home.',
      reasoning: 'Evening ambient conditions remain clean with active atmospheric mixing.',
      practicalAlternative: 'Standard handwashing upon entering.',
      expectedBenefit: 'Supports physical relaxation and mental recovery after work or study.'
    };
  } else if (tier === 'moderate') {
    step4 = {
      id: 'step-4',
      time: '06:00 PM – 07:00 PM',
      title: 'Evening Return & Light Shoe Care',
      category: 'Home Transition',
      badge: 'Basic Hygiene',
      badgeType: 'info',
      icon: 'ShieldCheck',
      originalHabit: 'Walking straight into living space',
      recommendation: 'Leave street shoes at the entryway and wash hands and face. Evening outdoor walks are fine in parks away from main roads.',
      reasoning: 'Evening rush hour increases local street-level dust, but residential neighborhoods remain acceptable.',
      practicalAlternative: 'Wipe down door entrance with a damp cloth every couple of days.',
      expectedBenefit: 'Prevents tracked road dust from spreading onto living room floors.'
    };
  } else if (tier === 'poor') {
    step4 = {
      id: 'step-4',
      time: '06:00 PM – 07:00 PM',
      title: 'Entryway Decontamination Protocol',
      category: 'Home Transition',
      badge: 'Decontamination',
      badgeType: 'warning',
      icon: 'ShieldCheck',
      originalHabit: 'Entering living space in outdoor clothing',
      recommendation: 'Remove outdoor shoes immediately at the door, change out of outdoor jackets, and wash face and eyes promptly.',
      reasoning: 'Winter particulate matter and tire soot cling to clothing, hair, and footwear during evening traffic.',
      practicalAlternative: 'Damp-mop entryway tiles instead of dry sweeping to capture settled dust without resuspending it into the breathing zone.',
      expectedBenefit: 'Stops outdoor toxic aerosols from contaminating your living room and sleeping quarters.'
    };
  } else {
    // severe
    step4 = {
      id: 'step-4',
      time: '05:45 PM – 07:00 PM',
      title: 'Strict Smog Decontamination & Airway Flush',
      category: 'Home Transition',
      badge: 'Hazard Decontamination',
      badgeType: 'alert',
      icon: 'ShieldCheck',
      originalHabit: 'Casual entry in street clothes',
      recommendation: 'Immediately strip outdoor outerwear at entrance, wash face, rinse eyes and gargle with warm water/saline. Take a shower if outdoors >30 mins.',
      reasoning: 'Severe smog deposits heavy polycyclic aromatic hydrocarbons and acidic aerosols on hair, skin, and clothing.',
      practicalAlternative: 'Store outerwear in a closed closet or laundry hamper by the door. Damp-wipe all floor transitions.',
      expectedBenefit: 'Reduces mucous membrane inflammation, eye stinging, and nighttime allergen triggers.'
    };
  }

  // -------------------------------------------------------------
  // STEP 5: Nighttime Rest & Sleep Sanctuary Setup
  // -------------------------------------------------------------
  let step5 = {};
  if (tier === 'good') {
    step5 = {
      id: 'step-5',
      time: '09:30 PM – 10:30 PM',
      title: 'Natural Nighttime Sleep Airflow',
      category: 'Rest & Recovery',
      badge: 'Natural Fresh Air',
      badgeType: 'success',
      icon: 'Moon',
      originalHabit: 'Sleeping with closed windows',
      recommendation: 'Bedroom windows can remain cracked for fresh, cool air circulation during sleep.',
      reasoning: 'Nighttime ambient conditions are clean and cool, promoting natural melatonin release and lung recovery.',
      practicalAlternative: 'If outdoor noise is noticeable, close windows and use normal room fan.',
      expectedBenefit: 'Prevents CO2 accumulation and delivers deep, restorative sleep.'
    };
  } else if (tier === 'moderate') {
    step5 = {
      id: 'step-5',
      time: '09:30 PM – 10:30 PM',
      title: 'Bedroom Wind-Down & Protected Rest',
      category: 'Rest & Recovery',
      badge: 'Protected Rest',
      badgeType: 'info',
      icon: 'Moon',
      originalHabit: 'Sleeping without checking windows',
      recommendation: 'Close street-facing windows before sleep. Keep bedroom door slightly ajar to balance indoor airflow.',
      reasoning: 'Nighttime cooling causes surface air to settle, slowly increasing localized road exhaust concentrations.',
      practicalAlternative: hasPurifier
        ? 'Run air purifier on silent/sleep mode.'
        : 'Ensure windows are shut and clean sheets are free of outdoor dust.',
      expectedBenefit: 'Ensures undisturbed 7–8 hours of restful sleep without coughing or dry throat.'
    };
  } else if (tier === 'poor') {
    step5 = {
      id: 'step-5',
      time: '09:30 PM – 10:30 PM',
      title: 'Sealed Bedroom & Air Purifier Optimization',
      category: 'Rest & Recovery',
      badge: 'Purifier Mode',
      badgeType: 'warning',
      icon: 'Moon',
      originalHabit: 'Sleeping with unmanaged room air',
      recommendation: 'Ensure bedroom windows are firmly closed. Place air purifier 3 feet from bed in sleep mode.',
      reasoning: 'Nighttime thermal stagnation locks pollutants in place until morning sun. Sleeping in unmanaged air causes morning nasal congestion.',
      practicalAlternative: hasPurifier
        ? 'Run purifier on sleep mode with door slightly ajar for CO2 balance.'
        : 'Place a rolled damp towel along the bottom door gap to block smog drafts.',
      expectedBenefit: 'Provides overnight respiratory recovery, preventing waking with throat irritation or sinus headaches.'
    };
  } else {
    // severe
    step5 = {
      id: 'step-5',
      time: '09:15 PM – 10:30 PM',
      title: 'High-Integrity Sleep Sanctuary Enclosure',
      category: 'Rest & Recovery',
      badge: 'Critical Sleep Shield',
      badgeType: 'alert',
      icon: 'Moon',
      originalHabit: 'Sleeping with standard drafts',
      recommendation: 'Complete bedroom seal. Place air purifier on continuous medium/high mode 45 mins before bedtime, then switch to quiet night mode.',
      reasoning: 'Dangerous nocturnal smog levels penetrate loose window gaskets. Breathing severe smog during sleep causes nocturnal bronchospasms and microvascular stress.',
      practicalAlternative: hasPurifier
        ? 'Position purifier directly in the breathing zone path. Ensure zero drafts.'
        : 'Tape window seams with masking tape and place damp towels at all door gaps. Use DIY Corsi-Rosenthal unit if available.',
      expectedBenefit: 'Creates a safe micro-environment where lung tissue can recover from daytime toxic aerosol exposures.'
    };
  }

  return [step1, step2, step3, step4, step5];
};

// AI Assistant Knowledge Base for Instant Intelligent Demo Responses
export const AI_SUGGESTED_QUESTIONS = [
  'How should I plan my day when AQI is high?',
  'Is it safe to exercise outdoors today?',
  'How can I improve indoor air quality?',
  'What precautions should I take during my commute?',
  'How can I reduce my contribution to air pollution?'
];

export const AI_KNOWLEDGE_BASE = {
  // Conversational Intent: Greetings
  greeting: {
    title: 'Welcome to BreatheWise',
    response: (name, city, aqi) => `Hello ${name || 'there'}! Great to meet you.

I am **BreatheWise**, your personal AI-powered air-quality and daily routine companion. I help you navigate urban smog by adapting your schedules, recommending safe exercise windows, optimizing indoor ventilation, and cutting personal emissions.

Currently for **${city?.name || 'your area'}**, the air quality is **${getAqiCategory(aqi).category}** (AQI ${aqi}).

How can I help you today? You can choose one of the suggested prompts above or ask about workouts, masks, or ventilation!`
  },

  // Conversational Intent: Gratitude
  gratitude: {
    title: 'You Are Very Welcome!',
    response: (name) => `You're very welcome, ${name || 'friend'}! 

Navigating winter air pollution is all about taking practical, informed precautions without panicking. Feel free to ask anytime you need a quick schedule check, mask recommendation, or indoor air tips.

Breathe easy and stay safe!`
  },

  // Conversational Intent: Goodbye
  goodbye: {
    title: 'Take Care & Breathe Safe',
    response: (name) => `Goodbye for now, ${name || 'friend'}! 

Before heading out, be sure to check the **Daily Routine** tab for hour-by-hour atmospheric updates. Stay safe and have a healthy day!`
  },

  // Conversational Intent: Capabilities / Identity
  identity: {
    title: 'What BreatheWise AI Can Do For You',
    response: () => `Here is how BreatheWise assists you during urban air pollution events:

1. **Personalized Daily Routines:** Restructures your workouts, commute times, and indoor ventilation around diurnal smog cycles.
2. **Exercise Guidance:** Evaluates current particulate levels (PM2.5/PM10) to determine whether outdoor cardio is safe or if indoor alternatives are needed.
3. **Indoor Air Optimization:** Actionable advice on ventilation windows, cooking exhaust protocols, wet mopping, and True HEPA filtration.
4. **Commuter Defense:** Specific protection strategies for cars (AC recirculation), metro transit, two-wheelers, and certified N95 mask usage.
5. **Sustainable Impact:** Tracks and estimates your personal avoided carbon and particulate emissions.

*(Note: Currently running in prototype demo mode. Full conversational reasoning with live sensor streaming will be powered by Google Gemini in Stage 2!)*`
  },

  // Suggested Prompt 1: Plan Day High AQI
  plan_day_high_aqi: {
    title: 'Comprehensive Daily Smog Blueprint',
    response: (name, city, aqi) => `When ambient AQI is elevated (above 150), daily personal exposure can be halved by planning around atmospheric cycles:

1. **Morning Inversion Caution (6:00 AM – 9:00 AM):**
   Cold surface air traps vehicular and biomass exhaust near breathing height. Postpone morning outdoor runs, and keep bedroom windows sealed.

2. **Commute Protection (Rush Hour):**
   Opt for Metro or sealed public transit. If driving, set air intake to **Recirculation** (the curved car arrow button). Wear a certified N95 or FFP2 mask during platform waits.

3. **Strategic Afternoon Air Flush (1:30 PM – 2:15 PM):**
   If indoor air feels stale or drowsy from CO2, this is your cleanest window for a short 15-minute cross-ventilation before ground temperatures cool again.

4. **Evening Transition (6:00 PM – 7:00 PM):**
   Leave shoes at the entrance and swap out outdoor jackets immediately to avoid distributing soot onto bedding and sofas.

5. **Sleep Sanctuary Setup (9:30 PM):**
   Run your HEPA air purifier on sleep mode (or seal door draft gaps with damp towels if you don't own a purifier) for uninterrupted recovery sleep.

*Check the **Daily Routine** tab to see your exact timeline adaptations!*`
  },

  // Suggested Prompt 2: Exercise Safety
  exercise_safety: {
    title: 'Outdoor Exercise Safety & Health Protocols',
    response: (name, city, aqi) => {
      const cat = getAqiCategory(aqi);
      return `Here is your exercise safety assessment for **${city?.name || 'your location'}** (Current AQI: **${aqi}** — *${cat.category}*):

**Direct Recommendation:**
${aqi <= 50 
  ? '✅ **Fully Safe for Outdoor Exercise.** Air quality is healthy. Enjoy outdoor running, cycling, or field sports without restriction.'
  : aqi <= 100
  ? '⚠️ **Outdoor Exercise Allowed with Route Caution.** Safe for healthy adults. Pick interior park paths away from busy traffic arteries. Sensitive individuals should monitor for throat irritation.'
  : aqi <= 200
  ? '🛑 **Shift Strenuous Cardio Indoors.** Heavy outdoor running or cycling is not advised. During vigorous exercise, your minute ventilation jumps 10x to 20x, forcing PM2.5 deep into pulmonary alveoli where it cannot be coughed out.'
  : '🚨 **Strictly Cancel All Outdoor Exertion.** Hazardous smog levels. Even light walking outdoors triggers rapid airway inflammation. Limit movement to gentle indoor stretching in a sealed room.'}

**Safe Indoor Alternatives for Elevated Smog Days:**
- 30-minute living room bodyweight circuit (squats, pushups, core intervals)
- Indoor stationary bike or treadmill with windows shut
- Restorative yoga, mobility work, and resistance bands with filtered indoor air`;
    }
  },

  // Suggested Prompt 3: Indoor Air Improvement
  indoor_air_improvement: {
    title: 'Practical Indoor Air Optimization Guide',
    response: () => `Indoor air can easily become 2x to 5x dirtier than outdoor air if contaminants are trapped. Here is the actionable hierarchy of improvements:

1. **Eliminate Indoor Sources First (Most Critical):**
   - Discontinue incense sticks (agarbatti) and mosquito coils. A single burning mosquito coil releases particulate matter equivalent to ~75 cigarettes.
   - Always run the kitchen exhaust chimney or open a kitchen vent before frying spices or high-heat searing.

2. **Targeted Wet Cleaning:**
   - Dry sweeping with traditional brooms resuspends settled toxic PM10 into the breathing zone for up to 2 hours. Always use a damp microfiber mop.

3. **Strategic Ventilation Timing:**
   - Never ventilate during morning (6–9 AM) or evening (6–9 PM) smog peaks. The safest window is between **1:30 PM and 2:30 PM** when solar heating temporarily breaks the ground-level inversion.

4. **Filtration Setup:**
   - **With an air purifier:** Verify True HEPA (H13) rating. Keep it 3 feet away from walls and avoid running it with exterior windows wide open.
   - **Without an air purifier:** Build a low-cost Corsi-Rosenthal box (standard box fan + MERV-13 filter) and seal door bottom gaps with damp towels.`
  },

  // Suggested Prompt 4: Commute Precautions
  commute_precautions: {
    title: 'Commuter Smog & Roadside Protection Guide',
    response: () => `Commuters absorb their highest daily dose of toxic nitrogen oxides (NO2) and diesel soot during rush hour. Here is how to shield yourself:

- **Metro / Electric Rail:** The safest option. Modern metro systems and underground stations filter out a significant percentage of ambient road smog.
- **Car / Cab:**
  - Turn **OFF** fresh air intake and toggle **ON Cabin Air Recirculation** (the curved arrow button). This single button cuts in-cabin PM2.5 intrusion by 75% to 90%.
  - Upgrade your cabin air filter to an activated carbon / HEPA unit during regular vehicle servicing.
- **Two-Wheeler / Walking:**
  - Standard cloth or blue surgical masks provide zero seal against microscopic PM2.5. Wear a certified **N95 or FFP2 mask with an adjustable metal nose clip**.
  - Choose secondary residential streets rather than following directly behind heavy diesel trucks and buses at red lights.`
  },

  // Suggested Prompt 5: Reduce Contribution
  reduce_contribution: {
    title: 'Individual Actions That Cut Urban Air Emissions',
    response: () => `While industrial policy is essential, individual transport and consumption choices directly shape neighborhood air quality:

1. **Shift One Weekly Commute to Public Transit:**
   Taking the metro or bus instead of driving a private petrol car avoids roughly **110 grams of CO2 and crucial grams of NOx/PM per kilometer**. Check the **My Impact** tab to calculate your savings!

2. **Eliminate Open Biomass & Leaf Burning:**
   Never burn dry leaves or domestic trash. A single leaf pile fire releases dense polycyclic aromatic hydrocarbons (PAHs) that linger in neighborhood air for hours.

3. **Optimize Vehicle Maintenance:**
   Keep tire pressure at manufacturer specs and change engine oil on time. Proper tire inflation reduces fuel consumption and brake/tire friction dust by 3–5%.

4. **Conserve Peak Winter Electricity:**
   Urban electricity during peak winter hours often relies on fossil-fuel peaker plants. Turning off unused appliances helps curb power station emissions.`
  },

  // Domain Topic: Mask Guide
  mask_guide: {
    title: 'Mask Guide: What Actually Protects Against PM2.5',
    response: () => `Here is the scientific reality of mask protection against urban smog:

- **Cloth & Bandana Masks (0–10% Filtration):** The weave of cotton fabric is roughly 100 to 200 microns wide. Microscopic PM2.5 particles (2.5 microns) pass right through.
- **Blue Surgical Masks (10–30% Real-World Seal):** While the filter material is decent, surgical masks do not seal against the face. Toxic air bypasses the edges via the path of least resistance.
- **Certified N95 / FFP2 / KN95 Masks (95%+ Filtration):** These utilize electrostatically charged meltblown polypropylene fibers that trap micro-particles down to 0.3 microns. Ensure the nose clip is pinched tightly and the perimeter is sealed with no air leaking around the cheeks.`
  },

  // Domain Topic: Winter Inversion Science
  inversion_science: {
    title: 'Why Winter Smog Stagnates Near the Ground',
    response: () => `Winter air pollution spikes dramatically due to a meteorological phenomenon called **Thermal Inversion**:

1. **Normal Conditions:** Warmer air sits near the ground and naturally rises, carrying vehicle exhaust and smoke high into the troposphere to disperse.
2. **Winter Inversion:** On cold, calm winter nights, the ground cools rapidly. A layer of cold, dense air gets trapped beneath a ceiling of warmer air.
3. **The Trap:** This warm air layer acts like a physical lid. Vehicle exhaust, construction dust, and biomass smoke emitted at ground level cannot rise, creating an intensely concentrated smog layer right where we walk and breathe.
4. **The Remedy:** Solar radiation warms the ground by early afternoon (1 PM to 2 PM), temporarily breaking the inversion layer. That is why BreatheWise schedules ventilation windows for early afternoon!`
  },

  // Domain Topic: Sensitive Demographics
  vulnerable_groups: {
    title: 'Advisory for Asthma, Children, and Seniors',
    response: () => `Children, older adults, and individuals with respiratory conditions are disproportionately vulnerable to urban smog:

- **Developing Children:** Children inhale more air per pound of body weight than adults, and their narrower airways are easily inflamed by fine particulates. Keep outdoor school sports indoors when AQI exceeds 100.
- **Asthma & COPD Sufferers:** Keep rescue bronchodilator inhalers easily accessible. Cold air combined with PM2.5 triggers immediate bronchospasms. Rinse throat with warm water after being outside.
- **Senior Households:** High ambient PM2.5 can trigger microvascular constriction and elevated blood pressure. Ensure bedroom air is filtered and avoid morning outdoor walks during severe smog advisories.`
  },

  // Domain Topic: Houseplants vs Purifiers
  houseplants: {
    title: 'The Truth About Air-Purifying Plants vs HEPA Filters',
    response: () => `While houseplants (like Snake Plants, Spider Plants, and Areca Palms) are wonderful for indoor humidity, aesthetics, and mental well-being, scientific studies clarify an important distinction:

- **What Plants DO:** Over days or weeks, plants can absorb trace volatile organic compounds (VOCs like benzene) through soil microbes.
- **What Plants DO NOT DO:** Plants **cannot filter particulate matter (PM2.5 or PM10)**. Microscopic smog particles remain suspended in the air.
- **Verdict:** Do not rely on houseplants as a replacement for mechanical filtration. To remove smog particles, a certified True HEPA filter or a DIY Corsi-Rosenthal box fan is essential.`
  }
};

// Indoor Air Guide Articles & Cards
export const INDOOR_GUIDE_CARDS = [
  {
    id: 'ventilation-timing',
    category: 'ventilation',
    title: 'The Midday Air Exchange Rule',
    tag: 'High Impact',
    icon: 'Wind',
    summary: 'Why opening windows at 2 PM is up to 60% safer than opening them at 8 AM during winter smog.',
    content: 'Winter air experiences thermal inversion: cooler air sits near the ground, trapping morning rush-hour emissions. Between 1:00 PM and 3:30 PM, solar radiation heats the surface, creating natural convection that dilutes ground-level contaminants. Open windows for 15-20 minutes during this midday window to flush indoor CO2, then reseal.',
    tips: [
      'Avoid opening street-facing windows during peak morning (7-10 AM) and evening (6-9 PM) traffic.',
      'Use opposite windows to create a brief, high-velocity cross draft rather than leaving windows slightly open all day.'
    ]
  },
  {
    id: 'kitchen-ventilation',
    category: 'cooking',
    title: 'Kitchen Smoke & High-Heat Cooking',
    tag: 'Critical Health',
    icon: 'Flame',
    summary: 'Frying, grilling, and deep searing can spike indoor PM2.5 above 500 µg/m³ within 10 minutes.',
    content: 'Cooking oils heated beyond their smoke point aerosolize microscopic fatty acids and polycyclic aromatic hydrocarbons. Without adequate extraction, this indoor particulate cloud lingers across bedrooms and living rooms for hours.',
    tips: [
      'Turn on your kitchen exhaust or range hood 1 minute before lighting the stove, and leave it running for 5 minutes after cooking completes.',
      'Keep interior kitchen doors closed while cooking so particulate smoke doesn’t migrate to sleep quarters.',
      'Choose oils with higher smoke points (ghee, avocado oil, refined mustard) over unrefined seed oils for high-heat cooking.'
    ]
  },
  {
    id: 'wet-cleaning',
    category: 'cleaning',
    title: 'Wet Mop Protocol vs Dry Sweeping',
    tag: 'Zero Cost',
    icon: 'Sparkles',
    summary: 'Traditional dry sweeping resuspends toxic PM10 into the human breathing zone for up to 2 hours.',
    content: 'When fine dust settles on floors and tiles, using a dry broom merely pulverizes the particles and lifts them airborne. A damp microfiber cloth or damp mop binds to micro-dust via electrostatic capillary action, removing it permanently without aerosolization.',
    tips: [
      'Always switch to damp microfiber mopping on tiled or wooden surfaces.',
      'Wipe bookshelves, electronics, and headboards with a damp cloth instead of dry feather dusters.'
    ]
  },
  {
    id: 'purifier-basics',
    category: 'purifiers',
    title: 'Air Purifiers: True HEPA vs Marketing Gimmicks',
    tag: 'Hardware',
    icon: 'Shield',
    summary: 'What to look for: H13 HEPA classification, CADR ratings, and why ionizers can be counterproductive.',
    content: 'True HEPA filters (H13 or H14 rating) mechanically capture 99.97% of particles down to 0.3 microns through impaction and diffusion. Avoid purifiers that market uncertified "HEPA-type" filters or built-in ozone-generating ionizers, which can react with indoor chemicals to generate harmful secondary organic aerosols.',
    tips: [
      'Check CADR (Clean Air Delivery Rate) to ensure the purifier can cycle your room volume at least 4 to 5 times per hour.',
      'Replace HEPA filters every 6 to 9 months during heavy winter smog seasons to prevent motor strain.'
    ]
  },
  {
    id: 'affordable-alternatives',
    category: 'affordable',
    title: 'Affordable DIY Clean Air: The Corsi-Rosenthal Box',
    tag: 'Budget Friendly',
    icon: 'Cpu',
    summary: 'Build a high-performance air cleaner for a fraction of commercial costs using a box fan and MERV-13 filter.',
    content: 'Pioneered by environmental engineers, a Corsi-Rosenthal box combines a standard 20-inch box fan with one to four MERV-13 furnace filters taped into a cube. Scientific peer-reviewed studies have proven it achieves CADR performance comparable or superior to commercial units costing hundreds of dollars.',
    tips: [
      'Draft proofing: Place inexpensive foam tape or a rolled damp towel along bottom door gaps to block outside smog ingress.',
      'Houseplants: Snake plants and spider plants support humidity and psychological comfort, though note they do not remove microscopic PM2.5.'
    ]
  },
  {
    id: 'hidden-sources',
    category: 'sources',
    title: 'Eliminating Silent Indoor Pollutant Sources',
    tag: 'Prevention',
    icon: 'AlertTriangle',
    summary: 'The surprising hazards of indoor incense sticks, mosquito coils, and synthetic air fresheners.',
    content: 'Burning one traditional mosquito coil overnight emits particulate matter equivalent to approximately 75 to 100 cigarettes and significant formaldehyde. Scented candles and synthetic aerosol sprays release volatile organic compounds (VOCs) that irritate mucous membranes.',
    tips: [
      'Replace mosquito coils with physical mosquito nets or electronic ultrasonic traps.',
      'Switch scented room aerosols for natural air flushing and pure activated bamboo charcoal bags to absorb odors.'
    ]
  }
];

// Sustainable Impact Factors & Preset Journeys
export const IMPACT_BENCHMARKS = {
  carEmissionGPerKm: 140, // Average single-occupancy petrol vehicle: ~140g CO2/km
  metroEmissionGPerKm: 32, // Average urban electric metro per passenger-km: ~32g CO2/km
  busEmissionGPerKm: 68,   // Average municipal CNG/diesel bus per passenger-km: ~68g CO2/km
  carpoolEmissionGPerKm: 70, // 2-person carpool: ~70g CO2/km
  zeroEmissionGPerKm: 0,   // Walking or Cycling: 0g CO2/km

  pmAvoidedGPerKmCarVsMetro: 0.028 // Defensible estimated grams of PM2.5/PM10 avoided per km shifted
};

export const INITIAL_IMPACT_LOGS = [
  {
    id: 'log-1',
    date: 'Today',
    mode: 'metro',
    modeName: 'Metro Transit',
    distanceKm: 14,
    co2SavedKg: 1.51,
    pmSavedG: 0.39,
    notes: 'Morning & evening commute via Line 2'
  },
  {
    id: 'log-2',
    date: 'Yesterday',
    mode: 'carpool',
    modeName: 'Carpooling',
    distanceKm: 12,
    co2SavedKg: 0.84,
    pmSavedG: 0.22,
    notes: 'Shared ride with 2 colleagues'
  },
  {
    id: 'log-3',
    date: '2 days ago',
    mode: 'wfh',
    modeName: 'Work From Home',
    distanceKm: 16,
    co2SavedKg: 2.24,
    pmSavedG: 0.45,
    notes: 'Avoided solo vehicle trip entirely'
  }
];
