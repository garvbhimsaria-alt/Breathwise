/**
 * BreatheWise Dynamic Routine Generator ("Your Day, Reimagined")
 * 
 * Generates an adaptive, explainable daily timeline tailored to:
 * - User's preferred wake-up and sleep times
 * - Workout habits and timing preferences
 * - Lifestyle (Student, Outdoor Worker, Working Professional, WFH)
 * - Commute method and travel distance
 * - Household equipment (air purifier, AC)
 * - Current CPCB AQI classification (all 6 official CPCB tiers + missing/stale data)
 */

import { classifyAqi } from './aqiClassifier.js';

/**
 * Helper to add minutes to a 24-hour "HH:MM" string and return 24-hour "HH:MM".
 */
function addMinutesTo24Time(timeStr, minutesToAdd) {
  try {
    const parts = (timeStr || '06:30').split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    let totalMins = (h * 60 + m + minutesToAdd) % (24 * 60);
    if (totalMins < 0) totalMins += 24 * 60;
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    const padH = newH < 10 ? `0${newH}` : `${newH}`;
    const padM = newM < 10 ? `0${newM}` : `${newM}`;
    return `${padH}:${padM}`;
  } catch (e) {
    return '07:00';
  }
}

/**
 * Format a 24-hour "HH:MM" string to a friendly 12-hour display string (e.g. "8:00 AM").
 */
function formatDisplayTime(time24Str) {
  try {
    const parts = (time24Str || '06:30').split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    return `${displayH}:${displayM} ${period}`;
  } catch (e) {
    return '07:00 AM';
  }
}

/**
 * Format a time range given a 24-hour start string and duration in minutes.
 */
function formatTimeRange(start24Str, durationMins) {
  const end24Str = addMinutesTo24Time(start24Str, durationMins);
  return `${formatDisplayTime(start24Str)} – ${formatDisplayTime(end24Str)}`;
}

/**
 * Generates a personalized daily schedule timeline.
 * 
 * @param {Object} userProfile - User preferences and schedule
 * @param {Object|number} aqiData - Raw AQI or pre-classified AQI object
 * @param {Object} [options={}] - Options (timestamp, previousAqi)
 * @returns {Array<Object>} List of structured, explainable timeline entries
 */
export function generateDynamicRoutine(userProfile = {}, aqiData = null, options = {}) {
  // Classify or accept pre-classified AQI
  const aqiResult = typeof aqiData === 'object' && aqiData !== null && aqiData.categoryKey
    ? aqiData
    : classifyAqi(aqiData, options);

  const profile = {
    name: userProfile.name || 'Friend',
    lifestyle: userProfile.lifestyle || 'working_professional',
    commuteType: userProfile.commuteType || 'metro',
    commuteDistanceKm: Number(userProfile.commuteDistanceKm) || 10,
    exerciseHabit: userProfile.exerciseHabit || 'morning_runner',
    outdoorTime: userProfile.outdoorTime || 'early_morning',
    hasAirPurifier: userProfile.hasAirPurifier === true,
    hasAc: userProfile.hasAc === true,
    healthSensitivity: userProfile.healthSensitivity || 'none',
    wakeUpTime: userProfile.wakeUpTime || '06:30',
    sleepTime: userProfile.sleepTime || '22:30'
  };

  const isWfh = profile.lifestyle === 'wfh';
  const isStudent = profile.lifestyle === 'student';
  const isOutdoorWorker = profile.lifestyle === 'outdoor_worker';
  const hasPurifier = profile.hasAirPurifier;
  const isMorningRunner = profile.exerciseHabit === 'morning_runner';
  const isEveningExerciser = profile.exerciseHabit === 'evening_runner';
  const isSensitive = profile.healthSensitivity && profile.healthSensitivity !== 'none';

  // Caution level mapping: 0=Unknown/Missing, 1=Good, 2=Satisfactory, 3=Moderate, 4=Poor, 5=Very Poor, 6=Severe
  const cautionLevel = aqiResult.cautionLevel || 0;

  const timeline = [];

  // =========================================================================
  // ENTRY 1: Morning Movement & Physical Conditioning
  // =========================================================================
  const exerciseStartTime = profile.wakeUpTime;
  const exerciseTimeRange = formatTimeRange(exerciseStartTime, 45);

  let entry1 = {
    id: 'routine-step-1',
    time: exerciseTimeRange,
    category: 'Exercise & Conditioning',
    icon: 'Activity'
  };

  if (!aqiResult.valid) {
    entry1.title = isMorningRunner ? 'Precautionary Indoor Morning Conditioning' : 'Gentle Indoor Morning Mobility';
    entry1.badge = 'Data Offline • Indoor Baseline';
    entry1.badgeType = 'info';
    entry1.recommendedAction = 'Complete physical exercises indoors with windows shut until local smog visibility can be verified.';
    entry1.reason = 'Air quality reading is currently unavailable. Because winter morning boundary layers frequently trap unmonitored night soot, indoor conditioning provides a safe default.';
    entry1.alternative = 'Follow a 30-minute indoor bodyweight or mobility circuit with a room fan circulating air.';
    entry1.expectedBenefit = 'Ensures physical conditioning proceeds without risking blind exposure to high morning ground soot.';
    entry1.originalHabit = isMorningRunner ? 'Outdoor morning workout' : 'Morning wake-up routine';
  } else if (cautionLevel === 1) {
    // 1. GOOD (0–50)
    entry1.title = isStudent
      ? 'Campus Morning Run & Outdoor Athletics'
      : isOutdoorWorker
      ? 'Pre-Shift Outdoor Mobility & Joint Prep'
      : isWfh
      ? 'Fresh Air Morning Stroll & Outdoor Workout'
      : isMorningRunner
      ? 'Unrestricted Outdoor Morning Run / Cycling'
      : 'Morning Outdoor Stroll & Cardio Warmup';
    entry1.badge = aqiResult.trend === 'improving' ? 'Improving Air • Outdoor Safe' : 'Optimal Air (Good)';
    entry1.badgeType = 'success';
    entry1.recommendedAction = isStudent
      ? 'Take full advantage of pristine morning air for campus runs, outdoor sports training, or open-air walking across campus.'
      : isOutdoorWorker
      ? 'Air quality is pristine. Complete pre-shift outdoor stretching and physical mobility with zero respiratory strain.'
      : 'Enjoy unrestricted outdoor cardio in local parks or open grounds. Conditions are clean and safe for all aerobic conditioning.';
    entry1.reason = `Ambient air is Good (AQI ${aqiResult.aqi}). Overnight settling and atmospheric ventilation have kept particulate concentrations well within protective limits.`;
    entry1.alternative = 'If preferring indoor workouts, open windows wide to allow fresh natural airflow into your training space.';
    entry1.expectedBenefit = 'Maximizes lung vital capacity and cardiovascular endurance with zero particulate burden on bronchial tissues.';
    entry1.originalHabit = 'Outdoor morning training';
  } else if (cautionLevel === 2) {
    // 2. SATISFACTORY (51–100)
    entry1.title = isStudent
      ? 'Outdoor Campus Sports & Morning Walk'
      : isOutdoorWorker
      ? 'Outdoor Physical Warmup (Normal Shift Prep)'
      : isMorningRunner
      ? 'Outdoor Run in Green Parks (Satisfactory Air)'
      : 'Neighborhood Stroll (Satisfactory Air)';
    entry1.badge = isSensitive ? 'Sensitive Airways • Mild Caution' : 'Suitable for Public (Satisfactory)';
    entry1.badgeType = 'success';
    entry1.recommendedAction = isSensitive
      ? 'Outdoor workouts are generally suitable, but choose green parks away from busy traffic roads and monitor for minor throat tickles.'
      : isStudent
      ? 'Outdoor campus sports and workouts are fully suitable for the student body. Avoid exercising directly next to heavy campus traffic gates.'
      : 'Normal outdoor exercise permitted. Safe for healthy individuals; choose green park routes rather than heavy traffic corridors.';
    entry1.reason = `Air quality is Satisfactory (AQI ${aqiResult.aqi}). Pollutant levels pose no risk to the general public, though sensitive airways may notice minor dryness near congested roads.`;
    entry1.alternative = 'Run along tree-lined park trails rather than road perimeter sidewalks.';
    entry1.expectedBenefit = 'Preserves daily cardiovascular fitness while avoiding roadside particulate pockets.';
    entry1.originalHabit = 'Standard outdoor workout';
  } else if (cautionLevel === 3) {
    // 3. MODERATE (101–200)
    entry1.title = isStudent
      ? 'Covered Campus Gym / Park Route'
      : isOutdoorWorker
      ? 'Paced Warmup (Avoiding Morning Smoke Plumes)'
      : isMorningRunner
      ? 'Outdoor Run with Traffic Caution'
      : 'Neighborhood Park Walk (Interior Routes)';
    entry1.badge = isSensitive ? 'Moderate Caution • Sensitive Profile' : 'Caution Near Roads (Moderate)';
    entry1.badgeType = 'info';
    entry1.recommendedAction = isSensitive
      ? 'Reduce high-intensity outdoor sprinting by 20%, or shift workouts to an indoor campus or home studio.'
      : isOutdoorWorker
      ? 'Pace physical exertion during early morning surface stagnation; stay hydrated before beginning your outdoor shift.'
      : 'Outdoor workouts are acceptable in interior green parks. Steer clear of arterial roads with morning vehicle queues.';
    entry1.reason = `Air quality is Moderate (AQI ${aqiResult.aqi}). While safe for healthy adults, roadside vehicle exhaust creates localized particulate pockets that can irritate reactive airways.`;
    entry1.alternative = 'Switch high-intensity road running to an indoor treadmill or living room bodyweight circuit.';
    entry1.expectedBenefit = 'Preserves daily cardiovascular fitness while avoiding direct exposure to acute roadside combustion plumes.';
    entry1.originalHabit = 'Standard neighborhood run';
  } else if (cautionLevel === 4) {
    // 4. POOR (201–300)
    entry1.title = isStudent
      ? 'Indoor Campus Gym & Mobility (Replacing Outdoor Run)'
      : isOutdoorWorker
      ? 'Indoor Site Warmup & Paced Morning Exertion'
      : 'Adapted Indoor Cardio & Mobility (Replacing Outdoor Run)';
    entry1.badge = 'Smog Alert: Move Indoors (Poor)';
    entry1.badgeType = 'warning';
    entry1.recommendedAction = isStudent
      ? 'Shift athletic practice indoors. Replace outdoor campus running with indoor gym training, bodyweight circuits, or library study mobility.'
      : isOutdoorWorker
      ? 'Avoid heavy aerobic exertion before your shift starts. Complete gentle indoor mobility; wear your fitted N95 respirator during morning outdoor tasks.'
      : 'Shift strenuous workouts indoors. Replace outdoor jogging with home bodyweight intervals, treadmill, or yoga with windows closed.';
    entry1.reason = `Air quality is Poor (AQI ${aqiResult.aqi}). Cold morning thermal inversion holds soot at breathing height. Heavy outdoor exertion increases minute ventilation 10x to 20x, drawing PM2.5 deep into the lungs.`;
    entry1.alternative = 'Follow a 35-minute indoor HIIT or resistance band session. If using a gym, verify mechanical ventilation is active.';
    entry1.expectedBenefit = 'Avoids inhaling concentrated micro-particulates during the morning peak while keeping physical training on schedule.';
    entry1.originalHabit = isMorningRunner ? 'Outdoor morning run' : 'Outdoor walk';
  } else if (cautionLevel === 5) {
    // 5. VERY POOR (301–400)
    entry1.title = isStudent
      ? 'Indoor Dorm/Home Restorative Session (Outdoor Sports Paused)'
      : isOutdoorWorker
      ? 'Low-Exertion Indoor Prep (Heavy Lifting Paused)'
      : 'Low-Exertion Indoor Conditioning (Outdoor Exertion Paused)';
    entry1.badge = 'Health Warning: Pause Outdoor Cardio (Very Poor)';
    entry1.badgeType = 'alert';
    entry1.recommendedAction = isStudent
      ? 'Strongly discourage all outdoor campus sports and running. Complete indoor yoga or light stretching in your room.'
      : isOutdoorWorker
      ? 'Pause heavy pre-shift outdoor exertion. Complete gentle indoor joint mobility and hydrate before heading to your job site.'
      : 'Strongly discourage strenuous outdoor exercise. Move all cardio indoors into a room with filtered air; keep windows closed.';
    entry1.reason = `Air quality is Very Poor (AQI ${aqiResult.aqi}). Prolonged outdoor exertion risks acute respiratory illness and bronchial inflammation even in healthy individuals.`;
    entry1.alternative = 'Gentle indoor yoga, foam rolling, and mobility work with an air purifier active.';
    entry1.expectedBenefit = 'Directly shields pulmonary tissues from dense particulate burdens during high morning stagnation.';
    entry1.originalHabit = 'Outdoor physical activity';
  } else {
    // 6. SEVERE (401–500+)
    entry1.title = isStudent
      ? 'Campus Emergency Protocol: Zero Outdoor Physical Exertion'
      : isOutdoorWorker
      ? 'Occupational Safety Protocol: Avoid Non-Essential Exertion'
      : 'Emergency Advisory: Strictly Zero Outdoor Exertion';
    entry1.badge = 'Emergency Alert: Zero Outdoor Exertion (Severe)';
    entry1.badgeType = 'alert';
    entry1.recommendedAction = isStudent
      ? 'Strictly avoid all outdoor physical exertion. Follow local official school/university pollution advisories. Stay indoors in rooms with clean air.'
      : isOutdoorWorker
      ? 'In accordance with local pollution and labor emergency advisories, non-essential heavy outdoor exertion should be halted. Keep physical exertion gentle and rest in indoor shelters.'
      : 'Strictly avoid all non-essential outdoor physical exertion. Follow official local government health and pollution advisories. Keep movement gentle and indoors in a room with air filtration.';
    entry1.reason = `Air quality is Severe (AQI ${aqiResult.aqi}). Extreme aerosol concentrations trigger systemic vascular inflammation, microvascular stress, and acute bronchospasms.`;
    entry1.alternative = 'Gentle indoor stretching, restorative breathing, or light mobility in a room with air filtration and door drafts sealed.';
    entry1.expectedBenefit = 'Directly protects cardiac and respiratory pathways from hazardous toxic aerosols during emergency smog levels.';
    entry1.originalHabit = 'Outdoor physical activity';
  }

  timeline.push(entry1);

  // =========================================================================
  // ENTRY 2: Morning Travel / Commute Strategy
  // =========================================================================
  const commuteStartTime24 = addMinutesTo24Time(profile.wakeUpTime, 90); // ~1.5 hours after waking
  const commuteTimeRange = formatTimeRange(commuteStartTime24, 45);

  let entry2 = {
    id: 'routine-step-2',
    time: commuteTimeRange,
    category: isWfh ? 'Workspace Setup' : (isStudent ? 'Campus Commute' : (isOutdoorWorker ? 'Site Shift Strategy' : 'Essential Commute')),
    icon: 'Compass'
  };

  if (isWfh) {
    if (!aqiResult.valid) {
      entry2.title = 'Precautionary Desk Setup & Air Check';
      entry2.badge = 'Indoor Control Baseline';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Work from a dedicated room with closed exterior windows. Turn on an indoor air filter if available.';
      entry2.reason = 'Sensor telemetry is offline. Controlling your home room envelope eliminates blind exposure to trapped morning smog.';
      entry2.alternative = 'Keep interior doors ajar for oxygen flow without opening outside windows.';
      entry2.expectedBenefit = 'Eliminates travel-related exhaust exposure while keeping breathing zones clean.';
      entry2.originalHabit = 'Working from home';
    } else if (cautionLevel <= 2) {
      entry2.title = 'Desk Setup & Natural Workspace Ventilation';
      entry2.badge = 'Natural Fresh Airflow';
      entry2.badgeType = 'success';
      entry2.recommendedAction = 'Open courtyard windows to allow natural oxygen exchange before beginning morning focus work.';
      entry2.reason = `Outdoor air is clean (${aqiResult.category}). Natural ventilation prevents indoor CO2 buildup, morning brain fog, and lethargy.`;
      entry2.alternative = 'Keep windows cracked for continuous fresh airflow during morning study or work.';
      entry2.expectedBenefit = 'Supplies fresh oxygen and enhances cognitive focus with zero pollution intake.';
      entry2.originalHabit = 'Working with closed windows';
    } else if (cautionLevel === 3) {
      entry2.title = 'Controlled Workspace Airflow (Moderate Air)';
      entry2.badge = 'Controlled Airflow';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Open courtyard-facing windows for 30 minutes; keep street-facing windows shut to block rush-hour exhaust plumes.';
      entry2.reason = 'Rush-hour road traffic creates local particulate spikes near street windows, while courtyard air remains acceptable.';
      entry2.alternative = 'Use a desk fan for air movement if street noise or dust is noticeable.';
      entry2.expectedBenefit = 'Balances oxygen levels while blocking roadside combustion plumes.';
      entry2.originalHabit = 'Opening street windows indiscriminately';
    } else {
      entry2.title = cautionLevel >= 6 ? 'Emergency Home Office Envelope Enclosure' : 'Home Office Air Shielding Protocol';
      entry2.badge = cautionLevel >= 6 ? 'Envelope Sealed (Severe)' : 'Indoor Shielding (Poor/Very Poor)';
      entry2.badgeType = cautionLevel >= 6 ? 'alert' : 'warning';
      entry2.recommendedAction = cautionLevel >= 6
        ? 'Work from a single dedicated room with closed exterior windows. Position your air filter near your desk and seal door gaps.'
        : 'Work from a dedicated room with closed exterior windows. Position your air filter near your desk.';
      entry2.reason = 'Working remotely eliminates peak rush-hour roadside exhaust exposure entirely. Controlling your room envelope protects your breathing zone.';
      entry2.alternative = 'Take a 5-minute indoor mobility stretch break every hour rather than stepping out onto roadside balconies.';
      entry2.expectedBenefit = 'Eliminates travel-related exhaust exposure while optimizing indoor cognitive alertness.';
      entry2.originalHabit = 'Working near open windows';
    }
  } else if (isStudent) {
    // STUDENT COMMUTE & CAMPUS TRANSIT
    const mode = profile.commuteType || 'metro';
    const dist = profile.commuteDistanceKm || 8;

    if (!aqiResult.valid) {
      entry2.title = `Precautionary Campus Commute (${mode.toUpperCase()})`;
      entry2.badge = 'Cautious Campus Transit';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Wear an N95 mask during congested transit corridors and when walking across open campus areas.';
      entry2.reason = 'Sensor data is offline. Roadside traffic corridors and campus transit gates produce diesel particulate spikes during morning rush hour.';
      entry2.alternative = 'Use covered campus walkways where possible away from main vehicle roads.';
      entry2.expectedBenefit = 'Protects against sudden roadside exhaust plumes during unmonitored conditions.';
      entry2.originalHabit = `Campus travel (${dist} km)`;
    } else if (cautionLevel === 1) {
      entry2.title = 'Active Campus Travel (Walk, Cycle, or Shuttle)';
      entry2.badge = 'Unrestricted Travel (Good)';
      entry2.badgeType = 'success';
      entry2.recommendedAction = 'Ideal conditions for walking or cycling to campus. Transit windows may remain open. Enjoy active campus mobility.';
      entry2.reason = 'Ambient air is Good. Vehicle emissions dilute rapidly into clear ambient air with zero smog stagnation.';
      entry2.alternative = 'Cycle or walk with friends for morning physical activity.';
      entry2.expectedBenefit = 'Zero smog inhalation risk while supporting personal physical health and low-carbon urban transit.';
      entry2.originalHabit = `${mode} travel to campus (${dist} km)`;
    } else if (cautionLevel === 2) {
      entry2.title = 'Campus Commute (Satisfactory Air)';
      entry2.badge = 'Normal Campus Travel';
      entry2.badgeType = 'success';
      entry2.recommendedAction = 'Normal commute to classes. Sensitive students should choose tree-lined campus paths over walking along busy exterior bus roads.';
      entry2.reason = 'Air quality is Satisfactory. Suitable for the general student body with minimal particulate accumulation.';
      entry2.alternative = 'Take interior pedestrian campus paths rather than arterial perimeter avenues.';
      entry2.expectedBenefit = 'Maintains active campus commute with negligible exposure.';
      entry2.originalHabit = `Standard commute to campus (${dist} km)`;
    } else if (cautionLevel === 3) {
      entry2.title = 'Campus Transit with Roadside Awareness';
      entry2.badge = 'Roadside Awareness';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Take interior campus paths. Keep an N95 mask handy if waiting at open-air bus stops or congested campus perimeter gates.';
      entry2.reason = 'Campus entry gates experience localized exhaust accumulation from idling cars, buses, and autorickshaws.';
      entry2.alternative = 'Time your arrival 15 minutes before or after peak morning rush hour to avoid dense vehicle queues.';
      entry2.expectedBenefit = 'Avoids concentrated roadside exhaust clouds without schedule disruptions.';
      entry2.originalHabit = `Standard commute to classes (${dist} km)`;
    } else if (cautionLevel === 4) {
      entry2.title = 'Shielded Campus Travel & N95 Protection';
      entry2.badge = 'N95 Mask Required (Poor)';
      entry2.badgeType = 'warning';
      entry2.recommendedAction = 'Wear a certified N95 mask while walking across campus and waiting at transit stops. Close windows on buses or campus shuttles.';
      entry2.reason = 'Air quality is Poor. Vehicle exhaust and morning thermal inversion concentrate fine particulates along campus transit corridors.';
      entry2.alternative = 'Walk through interconnected building corridors rather than open roadside paths.';
      entry2.expectedBenefit = 'Provides a verified physical barrier against toxic roadside combustion aerosols.';
      entry2.originalHabit = `Commute without mask (${dist} km)`;
    } else if (cautionLevel === 5) {
      entry2.title = 'Protective Campus Transit (N95 Mandatory)';
      entry2.badge = 'High Protection Required (Very Poor)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = 'Wear an airtight certified N95/FFP2 mask for all campus walking. Minimize outdoor transit between campus buildings; study in indoor facilities.';
      entry2.reason = 'Very Poor air quality causes rapid bronchial irritation during outdoor walking. Micro-particles penetrate cloth and surgical masks.';
      entry2.alternative = 'Use campus shuttle services if available instead of long open-air pedestrian walks.';
      entry2.expectedBenefit = 'Filters over 95% of toxic combustion aerosols during essential campus travel.';
      entry2.originalHabit = `Walking across campus (${dist} km)`;
    } else {
      entry2.title = 'Emergency Campus Transit Protocol';
      entry2.badge = 'Emergency Travel Advisory (Severe)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = 'Minimize non-essential campus travel. Check for official school/university hybrid or remote advisories. If travel is essential, wear a tightly fitted N95/FFP2 respirator throughout transit and move directly into filtered campus buildings.';
      entry2.reason = 'Severe pollution triggers severe respiratory stress. Minimizing open-air transit is the primary protective measure.';
      entry2.alternative = 'Request online access for lectures or study sessions if local educational pollution advisories are active.';
      entry2.expectedBenefit = 'Directly prevents acute high-dose inhalation of hazardous particulate matter.';
      entry2.originalHabit = `Normal campus travel (${dist} km)`;
    }
  } else if (isOutdoorWorker) {
    // OUTDOOR / FIELD WORKER SHIFT PROTOCOL
    if (!aqiResult.valid) {
      entry2.title = 'Precautionary Site Shift Protocol';
      entry2.badge = 'Field PPE Baseline';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Wear a certified N95 respirator firmly sealed on site. Identify covered or indoor rest shelters for scheduled shift breathers.';
      entry2.reason = 'Sensor telemetry is offline. Field workers face extended cumulative exposure, making baseline respiratory protection essential.';
      entry2.alternative = 'Take 10-minute rest breaks in enclosed site cabins or transport vehicles every 90 minutes.';
      entry2.expectedBenefit = 'Shields lungs from unmonitored road and site particulates throughout the shift.';
      entry2.originalHabit = 'Working without respiratory PPE';
    } else if (cautionLevel === 1) {
      entry2.title = 'Unrestricted Outdoor Shift & Site Setup';
      entry2.badge = 'Optimal Field Conditions (Good)';
      entry2.badgeType = 'success';
      entry2.recommendedAction = 'Air quality is Good. Normal outdoor shift operations. Wear standard workplace PPE (helmet, safety boots, dust goggles as required).';
      entry2.reason = 'Clean atmospheric ventilation keeps particulate concentrations well below occupational concern thresholds.';
      entry2.alternative = 'Standard hydration and sun protection.';
      entry2.expectedBenefit = 'Zero air-pollution burden during full-shift physical labor.';
      entry2.originalHabit = 'Standard field work';
    } else if (cautionLevel === 2) {
      entry2.title = 'Normal Field Operations (Satisfactory Air)';
      entry2.badge = 'Normal Field Shift';
      entry2.badgeType = 'success';
      entry2.recommendedAction = 'Normal outdoor shift. Stay hydrated throughout the morning. Sensitive workers should note any dust sensitivity and keep an N95 handy.';
      entry2.reason = 'Air quality is Satisfactory. Suitable for full-shift outdoor occupational activities with basic site dust precautions.';
      entry2.alternative = 'Rinse face and eyes with clean water during mid-morning break.';
      entry2.expectedBenefit = 'Maintains safe occupational productivity with negligible pollution risk.';
      entry2.originalHabit = 'Standard field work';
    } else if (cautionLevel === 3) {
      entry2.title = 'Field Shift with Roadside Awareness';
      entry2.badge = 'Moderate Field Caution';
      entry2.badgeType = 'info';
      entry2.recommendedAction = 'Wear a standard particulate mask when working near heavy diesel vehicles or dusty excavation. Identify shaded or enclosed site rest areas for breaks.';
      entry2.reason = 'Moderate air quality creates localized exhaust plumes near traffic lanes and heavy machinery, causing throat dryness during physical labor.';
      entry2.alternative = 'Rotate heavy physical digging or demolition tasks with teammates to prevent continuous hyperventilation.';
      entry2.expectedBenefit = 'Prevents acute peak-hour roadside exhaust inhalation during physical work.';
      entry2.originalHabit = 'Working directly in dust plumes';
    } else if (cautionLevel === 4) {
      entry2.title = 'N95 Field Protocol & Scheduled Shelter Breaks';
      entry2.badge = 'N95 Respirator Required (Poor)';
      entry2.badgeType = 'warning';
      entry2.recommendedAction = 'Wear a certified N95 respirator fitted firmly with metal nose clip throughout outdoor shift. Take 15-minute shelter breaks inside an enclosed site office, security booth, or vehicle every 90 minutes.';
      entry2.reason = 'Air quality is Poor. Extended physical labor increases breath rate dramatically, pulling toxic diesel particles and ground soot deep into bronchial airways.';
      entry2.alternative = 'If air-conditioned shelter is unavailable, use shaded, enclosed rooms with doors shut to break continuous outdoor exposure.';
      entry2.expectedBenefit = 'Reduces inhaled fine particulate burden by 80% to 90% during an 8-hour outdoor shift.';
      entry2.originalHabit = 'Working in smog without respirator';
    } else if (cautionLevel === 5) {
      entry2.title = 'High Exposure Protocol: Task Rotation & N95';
      entry2.badge = 'High Occupational Hazard (Very Poor)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = 'Wear certified N95/FFP2 respirator with airtight seal. Rotate heavy manual physical tasks to reduce continuous exertion. Rest inside enclosed cabins or transport vehicles during scheduled breaks.';
      entry2.reason = 'Very Poor air quality poses severe risks during extended outdoor labor. Inhaled toxic aerosols cause acute airway constriction and systemic cardiovascular strain.';
      entry2.alternative = 'Request moving non-urgent outdoor tasks to covered storage or indoor workshop spaces where feasible.';
      entry2.expectedBenefit = 'Significantly limits severe particulate deposition in lung tissues during mandatory field work.';
      entry2.originalHabit = 'Unprotected physical outdoor labor';
    } else {
      entry2.title = 'Severe Occupational Advisory: Halt Heavy Outdoor Labor';
      entry2.badge = 'Occupational Emergency (Severe)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = 'In accordance with applicable government construction and environmental advisories, non-essential heavy outdoor labor should be paused. Wear a certified N95 respirator continuously, take mandatory breaks in enclosed shelters, and rinse eyes and throat regularly with clean water.';
      entry2.reason = 'Severe emergency air quality causes acute respiratory distress and cardiac stress during physical exertion. Official advisories restrict heavy outdoor construction and dust activities.';
      entry2.alternative = 'Perform indoor maintenance, tool inventory, or remote paperwork inside enclosed structures with windows closed.';
      entry2.expectedBenefit = 'Directly prevents acute toxic aerosol poisoning and emergency medical visits.';
      entry2.originalHabit = 'Continuous heavy outdoor exertion';
    }
  } else {
    // WORKING PROFESSIONAL COMMUTE
    const mode = profile.commuteType || 'metro';
    const dist = profile.commuteDistanceKm || 10;

    if (!aqiResult.valid) {
      entry2.title = `Precautionary Transit Strategy (${mode.toUpperCase()})`;
      entry2.badge = 'Cautious Transit';
      entry2.badgeType = 'info';
      entry2.recommendedAction = mode === 'car'
        ? 'Keep car windows closed and cabin air on recirculation during heavy traffic.'
        : 'Wear an N95 mask during congested transit corridors as a smart protective baseline.';
      entry2.reason = 'While sensor data is offline, roadside traffic corridors reliably produce diesel particulate spikes during morning rush hour.';
      entry2.alternative = 'Avoid walking immediately behind idling diesel buses at traffic lights.';
      entry2.expectedBenefit = 'Protects against sudden roadside exhaust plumes during unmonitored conditions.';
      entry2.originalHabit = `Standard ${mode} travel (${dist} km)`;
    } else if (cautionLevel === 1) {
      entry2.title = mode === 'walking' || mode === 'bike'
        ? 'Active & Low-Emission Commute Window'
        : `Unrestricted Commute via ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
      entry2.badge = 'Unrestricted Travel (Good)';
      entry2.badgeType = 'success';
      entry2.recommendedAction = mode === 'walking' || mode === 'bike'
        ? `Ideal conditions for walking or cycling your ${dist} km route. No mask required.`
        : `Safe and pleasant commute via ${mode}. Vehicle windows may remain open.`;
      entry2.reason = 'Ambient particulate levels are within clean protective thresholds. Tailpipe exhaust disperses rapidly into clear air.';
      entry2.alternative = 'Consider walking or cycling part of your journey for daily physical activity.';
      entry2.expectedBenefit = 'Zero smog inhalation risk while supporting personal physical health and low-carbon urban transit.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else if (cautionLevel === 2) {
      entry2.title = `Standard Commute via ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
      entry2.badge = 'Suitable for Public (Satisfactory)';
      entry2.badgeType = 'success';
      entry2.recommendedAction = mode === 'walking' || mode === 'bike'
        ? 'Walking or cycling is suitable. Sensitive commuters should choose tree-lined residential streets.'
        : `Normal commute via ${mode}. Vehicle windows may remain cracked.`;
      entry2.reason = 'Air quality is Satisfactory. Suitable for the general public with minimal traffic corridor pooling.';
      entry2.alternative = 'Take secondary shaded streets rather than walking alongside heavy bus lanes.';
      entry2.expectedBenefit = 'Maintains active low-carbon commute with negligible exposure.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else if (cautionLevel === 3) {
      entry2.title = `Standard Commute with Roadside Awareness (${mode.toUpperCase()})`;
      entry2.badge = 'Roadside Awareness (Moderate)';
      entry2.badgeType = 'info';
      entry2.recommendedAction = mode === 'walking' || mode === 'bike'
        ? 'Select residential secondary streets and protected cycle paths away from heavy bus avenues.'
        : mode === 'car'
        ? 'Keep windows closed in bumper-to-bumper traffic; switch to internal air recirculation.'
        : 'Standard public transit travel. Keep an N95 mask handy if waiting at open-air bus stops.';
      entry2.reason = 'Traffic intersections experience localized accumulation of diesel soot and nitrogen dioxide during peak rush hour.';
      entry2.alternative = 'Travel 15 minutes before or after peak congestion to avoid standing in slow-moving traffic queues.';
      entry2.expectedBenefit = 'Avoids concentrated roadside exhaust clouds without schedule disruptions.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else if (cautionLevel === 4) {
      entry2.title = `Shielded Commute & N95 Protection (${mode.toUpperCase()})`;
      entry2.badge = 'N95 Mask Required (Poor)';
      entry2.badgeType = 'warning';
      entry2.recommendedAction = mode === 'car'
        ? 'Toggle Cabin Air Recirculation ON throughout your drive. Keep all windows firmly closed.'
        : mode === 'metro'
        ? 'Wear a certified N95/FFP2 mask on platforms and access walkways. Underground train cars maintain filtered air.'
        : 'Wear a certified N95 mask with an airtight perimeter seal. Choose secondary streets rather than following diesel buses.';
      entry2.reason = 'Air quality is Poor. Setting vehicle AC to recirculation cuts in-car PM2.5 by 75% to 90%. N95 masks filter toxic micro-particulates on transit platforms.';
      entry2.alternative = 'Wear an N95 mask inside the car if your cabin air filter is unserviced or over a year old.';
      entry2.expectedBenefit = 'Provides a verified physical barrier against toxic combustion byproducts and roadside carcinogens.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else if (cautionLevel === 5) {
      entry2.title = `Protective Shielded Transit (${mode.toUpperCase()})`;
      entry2.badge = 'High Protection Required (Very Poor)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = mode === 'car'
        ? 'Mandatory Cabin Air Recirculation throughout drive. Keep windows firmly sealed.'
        : 'Wear certified N95/FFP2 mask tightly sealed. Shift from open two-wheelers to sealed mass transit (Metro) if possible.';
      entry2.reason = 'Very Poor air quality poses severe respiratory risks during open road travel. Tailpipe plumes concentrate dangerously at breathing height.';
      entry2.alternative = 'Shift commute departure 45 minutes earlier or later to avoid peak rush-hour concentration.';
      entry2.expectedBenefit = 'Significantly lowers inhalation of toxic combustion soot and fine particulates during transit.';
      entry2.originalHabit = `${mode} travel (${dist} km)`;
    } else {
      entry2.title = `Emergency Travel Advisory (${mode.toUpperCase()})`;
      entry2.badge = 'Emergency Travel Advisory (Severe)';
      entry2.badgeType = 'alert';
      entry2.recommendedAction = 'Minimize non-essential travel. If essential travel is unavoidable, use sealed mass transit or a vehicle with AC recirculation, and wear a tightly fitted N95/FFP2 respirator throughout transit.';
      entry2.reason = 'Severe pollution triggers severe respiratory stress. Minimizing open road exposure is essential.';
      entry2.alternative = 'Request working from home where permitted by corporate policies and official pollution advisories.';
      entry2.expectedBenefit = 'Directly prevents acute high-dose inhalation of hazardous particulate matter.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    }
  }

  timeline.push(entry2);

  // =========================================================================
  // ENTRY 3: Midday Ventilation & Workspace Environment
  // =========================================================================
  let entry3 = {
    id: 'routine-step-3',
    time: '01:15 PM – 02:00 PM',
    category: isStudent ? 'Campus Study Environment' : (isOutdoorWorker ? 'Midday Field Rest & Shelter' : 'Indoor Air & Ventilation'),
    icon: 'Wind'
  };

  if (!aqiResult.valid) {
    entry3.title = 'Controlled Midday Air Refresh (Courtyard Windows)';
    entry3.badge = '15m Precautionary Flush';
    entry3.badgeType = 'info';
    entry3.recommendedAction = 'Open courtyard or interior windows for 15 minutes during early afternoon to balance oxygen and carbon dioxide.';
    entry3.reason = 'Early afternoon solar warmth aids atmospheric mixing. A short midday window balances indoor oxygen without letting in heavy morning smog.';
    entry3.alternative = 'Keep interior room doors ajar to circulate air without opening exterior street windows.';
    entry3.expectedBenefit = 'Prevents afternoon carbon dioxide accumulation and midday drowsiness.';
    entry3.originalHabit = 'Opening or closing windows indiscriminately';
  } else if (cautionLevel === 1) {
    // 1. GOOD (0–50)
    entry3.title = isStudent
      ? 'Open Campus Study & Natural Airflow'
      : isOutdoorWorker
      ? 'Midday Shaded Rest & Clean Air Break'
      : 'Full Natural Home & Workspace Air Exchange';
    entry3.badge = 'Full Open Air Flush (Good)';
    entry3.badgeType = 'success';
    entry3.recommendedAction = isStudent
      ? 'Study in open campus greens, courtyard benches, or naturally ventilated libraries. Open classroom windows wide.'
      : isOutdoorWorker
      ? 'Take your lunch break in a shaded courtyard or outdoor site canteen. Ambient air is clean and safe.'
      : 'Open opposite windows and balcony doors wide. Allow natural cross-ventilation to thoroughly flush indoor air.';
    entry3.reason = `Outdoor air is clean and pristine (AQI ${aqiResult.aqi}). Natural airflow expels indoor cooking moisture, VOCs, and CO2 with zero exterior pollution penalty.`;
    entry3.alternative = 'Keep windows cracked throughout the afternoon for continuous fresh oxygen replenishment.';
    entry3.expectedBenefit = 'Lowers indoor CO2 below 500 ppm, preventing midday brain fog, headaches, and lethargy.';
    entry3.originalHabit = 'Keeping windows shut all day';
  } else if (cautionLevel === 2) {
    // 2. SATISFACTORY (51–100)
    entry3.title = isStudent
      ? 'Classroom & Library Ventilation'
      : isOutdoorWorker
      ? 'Midday Rest & Site Hygiene'
      : 'Natural Cross-Ventilation (Satisfactory Air)';
    entry3.badge = 'Natural Ventilation (Satisfactory)';
    entry3.badgeType = 'success';
    entry3.recommendedAction = isStudent
      ? 'Open classroom and library windows for fresh air. Sensitive students should avoid sitting directly beside open ground-floor street windows.'
      : isOutdoorWorker
      ? 'Rinse face and hands with clean water before eating lunch. Rest in a shaded site canteen or covered rest area.'
      : 'Open opposite windows for cross-ventilation (10:00 AM – 3:00 PM); close street-facing windows during peak traffic hours.';
    entry3.reason = `Air quality is Satisfactory (AQI ${aqiResult.aqi}). Safe for natural air exchange with minor caution advised alongside heavy traffic roads.`;
    entry3.alternative = 'Keep courtyard windows cracked rather than street-facing windows.';
    entry3.expectedBenefit = 'Refreshes indoor oxygen levels with negligible particulate intrusion.';
    entry3.originalHabit = 'Keeping windows shut';
  } else if (cautionLevel === 3) {
    // 3. MODERATE (101–200)
    entry3.title = isStudent
      ? 'Controlled Library / Classroom Air Window'
      : isOutdoorWorker
      ? 'Enclosed Shelter Lunch Break'
      : 'Controlled Midday Ventilation Window (45 Mins)';
    entry3.badge = 'Controlled Flush (45m)';
    entry3.badgeType = 'info';
    entry3.recommendedAction = isStudent
      ? 'Study in central campus libraries or study halls with filtered ventilation. Open windows for 30–45 minutes during midday solar peak.'
      : isOutdoorWorker
      ? 'Take your midday break in a covered or indoor site shelter away from direct vehicle exhaust and generator emissions.'
      : 'Open windows for 30–45 minutes during midday solar peak (11:30 AM – 1:30 PM), preferably on courtyard or non-street sides.';
    entry3.reason = 'Thermal convection breaks morning surface stagnation, making late morning to early afternoon the cleanest atmospheric window of the day.';
    entry3.alternative = 'If street traffic dust is visible, limit opening to windows facing away from roadways.';
    entry3.expectedBenefit = 'Refreshes stale indoor oxygen levels while keeping roadside dust intake to a minimum.';
    entry3.originalHabit = 'Uncontrolled window opening';
  } else if (cautionLevel === 4) {
    // 4. POOR (201–300)
    entry3.title = isStudent
      ? 'Indoor Library Study & Brief 15m Air Flush'
      : isOutdoorWorker
      ? 'Indoor Site Shelter Lunch & N95 Refresh'
      : 'Strict 15-Minute Strategic Cross-Ventilation';
    entry3.badge = 'Restricted Window (15m)';
    entry3.badgeType = 'warning';
    entry3.recommendedAction = isStudent
      ? 'Study inside central campus facilities. Limit window opening to a quick 15-minute cross-draft at 1:30 PM on non-roadside windows, then reseal.'
      : isOutdoorWorker
      ? 'Spend your full lunch break inside an enclosed site office, security cabin, or vehicle. Replace soiled N95 respirator and rinse eyes with water.'
      : 'Limit window opening to a quick 15-minute cross-draft at 1:30 PM on non-roadside windows, then immediately reseal.';
    entry3.reason = 'Solar radiation temporarily dilutes ground-level PM2.5 between 1:00 PM and 2:00 PM. This is your only safe window to flush trapped CO2 before evening stagnation sets in.';
    entry3.alternative = hasPurifier
      ? 'Air out for 15 minutes to flush CO2, then close and run air purifier on High/Turbo for 20 minutes.'
      : 'Keep interior room doors open to circulate air without pulling exterior roadside dust.';
    entry3.expectedBenefit = 'Clears cognitive-draining indoor CO2 buildup without trapping high volumes of ambient smog.';
    entry3.originalHabit = 'Keeping windows shut all day';
  } else if (cautionLevel === 5) {
    // 5. VERY POOR (301–400)
    entry3.title = isStudent
      ? 'Sealed Campus Study Hall & Air Filtration'
      : isOutdoorWorker
      ? 'Mandatory Enclosed Shelter & Hydration'
      : 'Windows Closed — Internal Circulation Active';
    entry3.badge = 'Windows Closed (Very Poor)';
    entry3.badgeType = 'alert';
    entry3.recommendedAction = isStudent
      ? 'Study in campus facilities with closed doors and filtered air. Avoid outdoor campus benches. Keep dorm windows closed.'
      : isOutdoorWorker
      ? 'Mandatory indoor shelter break. Spend lunch inside an enclosed room away from open dust. Drink warm fluids and rinse dust from face.'
      : 'Keep exterior windows and balcony doors closed throughout the day. Balance indoor air with internal circulation and air filtration.';
    entry3.reason = `Outdoor PM2.5 is at Very Poor levels (AQI ${aqiResult.aqi}). Opening windows for even 10 minutes will flood indoor rooms with fine soot that settles onto fabrics.`;
    entry3.alternative = hasPurifier
      ? 'Run HEPA air purifiers continuously on auto/medium mode. Use ceiling fans for circulation.'
      : 'Use DIY Corsi-Rosenthal box fans and seal door gaps with draft stoppers or damp towels.';
    entry3.expectedBenefit = 'Keeps indoor particulate concentrations 60% to 75% lower than ambient street levels.';
    entry3.originalHabit = 'Opening windows for air';
  } else {
    // 6. SEVERE (401–500+)
    entry3.title = isStudent
      ? 'Campus Sealed Envelope & Air Cleaning'
      : isOutdoorWorker
      ? 'Occupational Shelter Advisory: Pause Outdoor Tasks'
      : 'Zero Exterior Infiltration — Building Envelope Seal';
    entry3.badge = 'Windows Sealed • Emergency (Severe)';
    entry3.badgeType = 'alert';
    entry3.recommendedAction = isStudent
      ? 'Stay indoors in campus buildings with closed doors and air filtration. Avoid non-essential movement between buildings.'
      : isOutdoorWorker
      ? 'Halt heavy outdoor dust-generating tasks in line with local advisories. Take continuous shelter in enclosed rooms or cabins with closed doors.'
      : 'Strictly minimize exterior air infiltration. Keep exterior windows and doors firmly closed, while maintaining indoor air circulation with fans and air purifiers.';
    entry3.reason = `Outdoor PM2.5 is at hazardous Severe emergency levels (AQI ${aqiResult.aqi}). Opening exterior windows will flood rooms with dangerous micro-particulates.`;
    entry3.alternative = 'Keep internal doors ajar and run ceiling fans or air filtration to prevent carbon dioxide buildup without opening outside windows.';
    entry3.expectedBenefit = 'Maintains a safe indoor particle envelope far cleaner than the surrounding ambient atmosphere.';
    entry3.originalHabit = 'Opening windows for air';
  }

  timeline.push(entry3);

  // =========================================================================
  // ENTRY 4: Evening Transition & Decontamination
  // =========================================================================
  let entry4 = {
    id: 'routine-step-4',
    time: '06:00 PM – 07:00 PM',
    category: isStudent ? 'Campus Return & Study Setup' : (isOutdoorWorker ? 'Shift Decontamination' : 'Home Transition & Hygiene'),
    icon: 'ShieldCheck'
  };

  if (!aqiResult.valid) {
    entry4.title = 'Precautionary Evening Return & Hygiene';
    entry4.badge = 'Basic Hygiene';
    entry4.badgeType = 'info';
    entry4.recommendedAction = 'Leave street shoes at the entrance and wash face and hands promptly upon returning indoors.';
    entry4.reason = 'Sensor telemetry is offline. Basic entryway hygiene prevents tracking unmonitored road soot into living and study spaces.';
    entry4.alternative = 'Damp-wipe entryway floor tiles.';
    entry4.expectedBenefit = 'Maintains clean living quarters without unmonitored dust intrusion.';
    entry4.originalHabit = 'Entering living space in street clothes';
  } else if (cautionLevel === 1) {
    // 1. GOOD (0–50)
    entry4.title = isStudent
      ? 'Evening Campus Activities & Social Recreation'
      : isOutdoorWorker
      ? 'End of Shift: Standard Washup'
      : isEveningExerciser
      ? 'Outdoor Evening Workout / Park Run'
      : 'Evening Leisure & Outdoor Recreation';
    entry4.badge = 'Pleasant Evening (Good)';
    entry4.badgeType = 'success';
    entry4.recommendedAction = isStudent
      ? 'Enjoy outdoor campus sports, walking to the student center, or evening recreation. No special decontamination needed.'
      : isOutdoorWorker
      ? 'Shift completed. Standard washup and equipment stow. Evening air is clean and safe.'
      : isEveningExerciser
      ? 'Great conditions for an evening outdoor run, outdoor sports, or cycling in community parks.'
      : 'Enjoy an evening walk, outdoor dinner, or park recreation. No special decontamination needed.';
    entry4.reason = 'Evening ambient conditions remain clean with active atmospheric mixing and low particulate concentration.';
    entry4.alternative = 'Standard handwashing upon entering.';
    entry4.expectedBenefit = 'Supports physical relaxation and mental recovery after work or study.';
    entry4.originalHabit = 'Returning indoors';
  } else if (cautionLevel === 2) {
    // 2. SATISFACTORY (51–100)
    entry4.title = isStudent
      ? 'Evening Return to Dorm / Home'
      : isOutdoorWorker
      ? 'End of Shift: Wash Hands and Face'
      : 'Evening Return & Light Shoe Care';
    entry4.badge = 'Basic Hygiene (Satisfactory)';
    entry4.badgeType = 'success';
    entry4.recommendedAction = isStudent
      ? 'Return to dorm or home; wash face and hands after evening campus travel. Evening outdoor walks are fine away from main roads.'
      : isOutdoorWorker
      ? 'Wash hands, face, and forearms to remove site dust before heading home.'
      : 'Leave street shoes at the entryway and wash hands and face. Evening outdoor walks are fine in parks away from main roads.';
    entry4.reason = 'Air quality is Satisfactory. Evening rush hour increases local street-level dust, but residential neighborhoods remain acceptable.';
    entry4.alternative = 'Wipe down door entrance with a damp cloth every couple of days.';
    entry4.expectedBenefit = 'Prevents tracked road dust from spreading onto living room floors.';
    entry4.originalHabit = 'Walking straight into living space';
  } else if (cautionLevel === 3) {
    // 3. MODERATE (101–200)
    entry4.title = isStudent
      ? 'Evening Return & Airway Care'
      : isOutdoorWorker
      ? 'Shift Cleanup & Eye Rinse'
      : 'Evening Return & Roadside Dust Care';
    entry4.badge = 'Moderate Hygiene Care';
    entry4.badgeType = 'info';
    entry4.recommendedAction = isStudent
      ? 'Leave outdoor footwear at door, wash hands and face, and rinse throat with clean water after evening campus transit.'
      : isOutdoorWorker
      ? 'Wash face and eyes thoroughly with clean water; wipe down protective gear before storing.'
      : 'Leave street shoes at the door, change out of outdoor clothes, and wash face. Evening outdoor walks should be kept to interior parks.';
    entry4.reason = 'Nighttime cooling causes surface air to settle, slowly increasing localized road exhaust concentrations near street level.';
    entry4.alternative = 'Wipe down entrance tiles with a damp cloth.';
    entry4.expectedBenefit = 'Stops roadside dust from settling on bedroom and living room surfaces.';
    entry4.originalHabit = 'Entering living space in outdoor clothing';
  } else if (cautionLevel === 4) {
    // 4. POOR (201–300)
    entry4.title = isStudent
      ? 'Dorm/Home Decontamination Protocol'
      : isOutdoorWorker
      ? 'End-of-Shift Particulate Decontamination'
      : 'Entryway Decontamination Protocol';
    entry4.badge = 'Decontamination (Poor)';
    entry4.badgeType = 'warning';
    entry4.recommendedAction = isStudent
      ? 'Remove outdoor shoes at entrance, change into clean indoor clothes, wash face and eyes, and rinse throat with clean water.'
      : isOutdoorWorker
      ? 'Remove work boots at entrance, wash face, rinse eyes and gargle with clean water to expel settled particulates from throat.'
      : 'Remove outdoor shoes immediately at the door, change out of outdoor jackets, and wash face and eyes promptly.';
    entry4.reason = 'Winter particulate matter and tire soot cling to clothing, hair, and footwear during evening traffic.';
    entry4.alternative = 'Damp-mop entryway tiles instead of dry sweeping to capture settled dust without resuspending it into the breathing zone.';
    entry4.expectedBenefit = 'Stops outdoor toxic aerosols from contaminating your living room and sleeping quarters.';
    entry4.originalHabit = 'Entering living space in outdoor clothing';
  } else if (cautionLevel === 5) {
    // 5. VERY POOR (301–400)
    entry4.title = isStudent
      ? 'Strict Smog Decontamination & Airway Care'
      : isOutdoorWorker
      ? 'Critical Shift Decontamination Protocol'
      : 'Strict Smog Decontamination & Airway Flush';
    entry4.badge = 'Hazard Decontamination (Very Poor)';
    entry4.badgeType = 'alert';
    entry4.recommendedAction = isStudent
      ? 'Immediately remove outdoor clothing at entrance, wash face, rinse eyes and gargle with warm water. Keep dorm/room door closed.'
      : isOutdoorWorker
      ? 'Remove dusty outer workwear immediately at door, shower or wash face/hair thoroughly, and rinse eyes with clean water/saline. Store work clothes in a closed hamper.'
      : 'Immediately strip outdoor outerwear at entrance, wash face, rinse eyes and gargle with warm water/saline. Take a shower if outdoors >30 mins.';
    entry4.reason = 'Very Poor smog deposits heavy polycyclic aromatic hydrocarbons and acidic aerosols on hair, skin, and clothing during outdoor exposure.';
    entry4.alternative = 'Store outerwear in a closed closet or laundry hamper by the door. Damp-wipe all floor transitions.';
    entry4.expectedBenefit = 'Reduces mucous membrane inflammation, eye stinging, and nighttime allergen triggers.';
    entry4.originalHabit = 'Casual entry in street clothes';
  } else {
    // 6. SEVERE (401–500+)
    entry4.title = isStudent
      ? 'Emergency Decontamination & Room Enclosure'
      : isOutdoorWorker
      ? 'Emergency Shift Decontamination & Airway Relief'
      : 'Emergency Decontamination & Respiratory Relief';
    entry4.badge = 'Emergency Decontamination (Severe)';
    entry4.badgeType = 'alert';
    entry4.recommendedAction = isStudent
      ? 'Immediately remove outerwear at entrance, wash face thoroughly, gargle with warm water/saline, and hydrate. Keep room door closed and air filtered.'
      : isOutdoorWorker
      ? 'Emergency decontamination: strip dusty workwear at door, wash face and hair thoroughly, flush eyes with saline/clean water, gargle warm saline, and hydrate with warm fluids.'
      : 'Immediately strip outdoor outerwear at entrance, wash face, rinse eyes, gargle with warm saline water, and shower. Seal exterior door gaps with damp towels.';
    entry4.reason = 'Severe emergency smog deposits high concentrations of toxic combustion byproducts that irritate airways and skin continuously if not washed off.';
    entry4.alternative = 'Seal door thresholds with damp towels and damp-mop entryway floor to trap fine soot.';
    entry4.expectedBenefit = 'Directly prevents overnight respiratory irritation and reduces toxic aerosol absorption through skin and eyes.';
    entry4.originalHabit = 'Casual entry in street clothes';
  }

  timeline.push(entry4);

  // =========================================================================
  // ENTRY 5: Nighttime Rest & Sleep Sanctuary Setup
  // =========================================================================
  const sleepPrepTime24 = addMinutesTo24Time(profile.sleepTime, -45); // 45 mins before bedtime
  const sleepTimeRange = formatTimeRange(sleepPrepTime24, 45);

  let entry5 = {
    id: 'routine-step-5',
    time: sleepTimeRange,
    category: 'Rest & Recovery',
    icon: 'Moon'
  };

  if (!aqiResult.valid) {
    entry5.title = hasPurifier ? 'Protected Bedroom & Air Purifier Sleep Mode' : 'Precautionary Draft-Protected Bedroom';
    entry5.badge = 'Precautionary Sleep Protocol';
    entry5.badgeType = 'info';
    entry5.recommendedAction = hasPurifier
      ? 'Close bedroom windows. Run air purifier on quiet night mode.'
      : 'Ensure bedroom windows are firmly closed before sleeping. Keep interior doors slightly ajar for air circulation.';
    entry5.reason = 'Sensor telemetry is offline. Overnight winter cooling causes surface air stagnation, making closed bedroom windows a safe default.';
    entry5.alternative = 'Ensure clean bed linens and avoid burning incense in the bedroom.';
    entry5.expectedBenefit = 'Protects airways from unmonitored nocturnal smog pooling.';
    entry5.originalHabit = 'Sleeping without checking windows';
  } else if (cautionLevel === 1) {
    // 1. GOOD (0–50)
    entry5.title = 'Natural Nighttime Sleep Airflow';
    entry5.badge = 'Natural Fresh Air (Good)';
    entry5.badgeType = 'success';
    entry5.recommendedAction = 'Bedroom windows can remain cracked for fresh, cool air circulation during sleep.';
    entry5.reason = 'Nighttime ambient conditions are clean and cool, promoting natural melatonin release and lung recovery.';
    entry5.alternative = 'If outdoor noise is noticeable, close windows and use a standard room fan.';
    entry5.expectedBenefit = 'Prevents CO2 accumulation and delivers deep, restorative sleep.';
    entry5.originalHabit = 'Sleeping with closed windows';
  } else if (cautionLevel === 2) {
    // 2. SATISFACTORY (51–100)
    entry5.title = 'Clean Bedroom Rest & Airflow';
    entry5.badge = 'Clean Sleep (Satisfactory)';
    entry5.badgeType = 'success';
    entry5.recommendedAction = 'Bedroom windows can remain cracked for fresh air. Sensitive individuals facing busy roads should close street-side windows.';
    entry5.reason = 'Air quality is Satisfactory. Nocturnal cooling is safe for the general public, with minor caution for bedrooms directly above busy roads.';
    entry5.alternative = hasPurifier ? 'Run purifier on whisper mode.' : 'Use ceiling fan for air movement.';
    entry5.expectedBenefit = 'Maintains fresh oxygen flow and ensures restful, undisturbed sleep.';
    entry5.originalHabit = 'Sleeping without checking windows';
  } else if (cautionLevel === 3) {
    // 3. MODERATE (101–200)
    entry5.title = 'Bedroom Wind-Down & Protected Rest';
    entry5.badge = 'Protected Rest (Moderate)';
    entry5.badgeType = 'info';
    entry5.recommendedAction = 'Close street-facing windows before sleep. Keep bedroom door slightly ajar to balance indoor airflow.';
    entry5.reason = 'Nighttime cooling causes surface air to settle, slowly increasing localized road exhaust concentrations near street level.';
    entry5.alternative = hasPurifier
      ? 'Run air purifier on silent/sleep mode.'
      : 'Ensure windows are shut and clean sheets are free of outdoor dust.';
    entry5.expectedBenefit = 'Ensures undisturbed 7–8 hours of restful sleep without coughing or dry throat.';
    entry5.originalHabit = 'Sleeping without checking windows';
  } else if (cautionLevel === 4) {
    // 4. POOR (201–300)
    entry5.title = hasPurifier ? 'Sealed Bedroom & Air Purifier Sleep Mode' : 'Draft-Protected Bedroom Sanctuary';
    entry5.badge = hasPurifier ? 'HEPA Sleep Mode (Poor)' : 'Low-Cost Draft Seal (Poor)';
    entry5.badgeType = 'warning';
    entry5.recommendedAction = hasPurifier
      ? 'Ensure bedroom windows are firmly closed. Place air purifier 3 feet from bed on whisper/sleep mode.'
      : 'Ensure bedroom windows are shut tight. Place a rolled damp towel along bottom door gaps to block smog drafts.';
    entry5.reason = 'Nighttime thermal stagnation locks pollutants in place until morning sun. Sleeping in unmanaged air causes morning nasal congestion and airway tightness.';
    entry5.alternative = hasPurifier
      ? 'Run purifier on sleep mode with door slightly ajar for CO2 balance.'
      : 'Keep bedroom clean and free of dry-swept dust; use wet microfiber dusting.';
    entry5.expectedBenefit = 'Provides overnight respiratory recovery, preventing waking with throat irritation or sinus headaches.';
    entry5.originalHabit = 'Sleeping in unmanaged air';
  } else if (cautionLevel === 5) {
    // 5. VERY POOR (301–400)
    entry5.title = hasPurifier ? 'High-Integrity Sleep Sanctuary Enclosure' : 'Sealed Draft-Free Sleep Sanctuary';
    entry5.badge = hasPurifier ? 'Critical Sleep Shield (Very Poor)' : 'Draft Seal Enclosure (Very Poor)';
    entry5.badgeType = 'alert';
    entry5.recommendedAction = hasPurifier
      ? 'Complete bedroom seal. Run air purifier on medium mode 30 minutes before bedtime, then switch to quiet night mode.'
      : 'Complete bedroom envelope seal. Place damp towels along exterior door and window crevices to stop toxic draft infiltration.';
    entry5.reason = `Dangerous nocturnal smog levels (${aqiResult.category}) penetrate loose window gaskets. Breathing severe smog during sleep causes nocturnal bronchospasms and microvascular stress.`;
    entry5.alternative = hasPurifier
      ? 'Position purifier directly in the breathing zone path. Ensure zero drafts.'
      : 'Tape window seams with masking tape and use DIY Corsi-Rosenthal unit if available.';
    entry5.expectedBenefit = 'Creates a safe micro-environment where lung tissue can recover from daytime toxic aerosol exposures.';
    entry5.originalHabit = 'Sleeping with standard drafts';
  } else {
    // 6. SEVERE (401–500+)
    entry5.title = hasPurifier ? 'Emergency Sleep Sanctuary: Continuous HEPA' : 'Emergency Sealed Sleep Sanctuary';
    entry5.badge = hasPurifier ? 'Emergency Sleep Shield (Severe)' : 'Emergency Draft Seal (Severe)';
    entry5.badgeType = 'alert';
    entry5.recommendedAction = hasPurifier
      ? 'Emergency sleep enclosure: seal bedroom windows firmly. Run HEPA air purifier on continuous medium mode in your breathing zone path throughout the night.'
      : 'Emergency sleep sanctuary: seal bedroom envelope completely. Place damp towels along all exterior door gaps and window joints to block toxic night smog drafts.';
    entry5.reason = `Severe emergency pollution (AQI ${aqiResult.aqi}) triggers acute nighttime bronchospasms, elevated blood pressure, and morning headaches if inhaled during sleep.`;
    entry5.alternative = 'Keep internal bedroom door slightly ajar to prevent CO2 buildup while keeping outside windows sealed.';
    entry5.expectedBenefit = 'Directly protects cardiac and pulmonary systems during nocturnal inversion peaks.';
    entry5.originalHabit = 'Sleeping without checking windows';
  }

  timeline.push(entry5);

  return timeline.map(entry => ({
    ...entry,
    recommendation: entry.recommendedAction || entry.recommendation,
    recommendedAction: entry.recommendedAction || entry.recommendation,
    reasoning: entry.reason || entry.reasoning,
    reason: entry.reason || entry.reasoning,
    practicalAlternative: entry.alternative || entry.practicalAlternative,
    alternative: entry.alternative || entry.practicalAlternative,
  }));
}
