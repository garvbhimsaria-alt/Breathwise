/**
 * BreatheWise Dynamic Routine Generator ("Your Day, Reimagined")
 * 
 * Generates an adaptive, explainable daily timeline tailored to:
 * - User's preferred wake-up and sleep times
 * - Workout habits and timing preferences
 * - Lifestyle (Professional, Student, WFH, Field Worker)
 * - Commute method and travel distance
 * - Household equipment (air purifier, AC)
 * - Current CPCB AQI classification (including missing, stale, or improving data)
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
  const hasAsthma = profile.healthSensitivity === 'mild_asthma' || profile.healthSensitivity === 'sensitive_throat';

  const cautionLevel = aqiResult.cautionLevel || 0; // 0=Unknown/Missing, 1=Good, 2=Satisfactory, 3=Moderate, 4=Poor, 5=Very Poor, 6=Severe
  const isElevated = cautionLevel >= 4; // Poor, Very Poor, or Severe
  const isExtreme = cautionLevel >= 5;  // Very Poor or Severe
  const isClean = cautionLevel > 0 && cautionLevel <= 2; // Good or Satisfactory

  const timeline = [];

  // -------------------------------------------------------------------------
  // ENTRY 1: Morning Movement & Physical Conditioning
  // -------------------------------------------------------------------------
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
    entry1.recommendedAction = 'Complete physical exercises indoors with windows shut until local smog visibility can be observed.';
    entry1.reason = 'Air quality reading is currently unavailable. Because winter morning boundary layers frequently trap unmonitored night soot, indoor conditioning provides a safe default.';
    entry1.alternative = 'Follow a 30-minute indoor bodyweight or yoga routine with a clean room fan circulating air.';
    entry1.expectedBenefit = 'Ensures physical conditioning proceeds without risking blind exposure to high morning ground soot.';
    entry1.originalHabit = isMorningRunner ? 'Outdoor morning run' : 'Morning wake-up routine';
  } else if (isClean) {
    entry1.title = isMorningRunner ? 'Unrestricted Outdoor Morning Run / Cycling' : 'Fresh Air Morning Stroll & Light Jog';
    entry1.badge = aqiResult.trend === 'improving' ? 'Improving Air • Outdoor Safe' : 'Optimal Window';
    entry1.badgeType = 'success';
    entry1.recommendedAction = 'Take full advantage of clean morning conditions for vigorous outdoor aerobic exercise in local parks or open grounds.';
    entry1.reason = `Ambient air is ${aqiResult.category} (AQI ${aqiResult.aqi}). Overnight settling and clear atmospheric ventilation have kept particulate concentrations well within protective limits.`;
    entry1.alternative = 'If preferring indoor workouts, open windows wide to allow fresh natural oxygen flow into your training space.';
    entry1.expectedBenefit = 'Maximizes lung vital capacity and cardiovascular endurance with zero particulate burden on bronchial airways.';
    entry1.originalHabit = 'Outdoor morning training';
  } else if (cautionLevel === 3) {
    // Moderate
    entry1.title = isMorningRunner ? 'Outdoor Run with Traffic Caution' : 'Neighborhood Park Walk (Interior Routes)';
    entry1.badge = hasAsthma ? 'Moderate Caution • Sensitive Profile' : 'Caution Near Roads';
    entry1.badgeType = 'info';
    entry1.recommendedAction = hasAsthma
      ? 'Reduce high-intensity outdoor sprinting by 20%, or shift workouts to an indoor studio.'
      : 'Outdoor workouts are acceptable in green parks. Steer clear of arterial roads with morning vehicle queues.';
    entry1.reason = `Air quality is Moderate (AQI ${aqiResult.aqi}). While safe for healthy adults, roadside vehicle exhaust creates localized particulate pockets that can irritate reactive airways.`;
    entry1.alternative = 'Switch high-intensity road running to an indoor treadmill or living room circuit.';
    entry1.expectedBenefit = 'Preserves daily cardiovascular fitness while avoiding direct exposure to acute roadside combustion plumes.';
    entry1.originalHabit = 'Standard neighborhood run';
  } else if (cautionLevel === 4) {
    // Poor
    entry1.title = 'Adapted Indoor Cardio & Mobility (Replacing Outdoor Run)';
    entry1.badge = 'Smog Alert: Move Indoors';
    entry1.badgeType = 'warning';
    entry1.recommendedAction = 'Shift strenuous workouts indoors. Replace outdoor jogging with home bodyweight intervals, treadmill, or yoga with windows closed.';
    entry1.reason = `Air quality is Poor (AQI ${aqiResult.aqi}). Cold morning thermal inversion holds soot at breathing height. Heavy outdoor exertion increases minute ventilation 10x to 20x, drawing PM2.5 deep into the lungs.`;
    entry1.alternative = 'Follow a 35-minute indoor HIIT or resistance band session. If using a gym, verify mechanical ventilation is active.';
    entry1.expectedBenefit = 'Avoids inhaling concentrated micro-particulates during the morning peak while keeping physical training on schedule.';
    entry1.originalHabit = isMorningRunner ? 'Outdoor morning run' : 'Outdoor walk';
  } else {
    // Very Poor or Severe (Extreme)
    entry1.title = 'Low-Exertion Indoor Restorative Routine (Outdoor Exertion Strictly Paused)';
    entry1.badge = 'Hazard Alert: Zero Outdoor Exertion';
    entry1.badgeType = 'alert';
    entry1.recommendedAction = 'Strictly cancel all outdoor exercise and heavy breathing. Complete only gentle indoor stretching, mobility, or restorative yoga in a sealed room.';
    entry1.reason = `Air quality is ${aqiResult.category} (AQI ${aqiResult.aqi}). Ambient micro-aerosol concentrations trigger acute airway inflammation and systemic cardiovascular strain even during brief outdoor exertion.`;
    entry1.alternative = 'Gentle indoor yoga, foam rolling, and deliberate breathing within a room with door drafts sealed.';
    entry1.expectedBenefit = 'Directly shields cardiac and pulmonary systems from hazardous toxic aerosols during the day’s most dangerous inversion peak.';
    entry1.originalHabit = 'Outdoor physical activity';
  }

  timeline.push(entry1);

  // -------------------------------------------------------------------------
  // ENTRY 2: Morning Commute & Daily Travel Strategy
  // -------------------------------------------------------------------------
  const commuteStartTime24 = addMinutesTo24Time(profile.wakeUpTime, 90); // ~1.5 hours after waking
  const commuteTimeRange = formatTimeRange(commuteStartTime24, 45);

  let entry2 = {
    id: 'routine-step-2',
    time: commuteTimeRange,
    category: isWfh ? 'Workspace Setup' : 'Essential Commute',
    icon: 'Compass'
  };

  if (isWfh) {
    entry2.title = isElevated ? 'Home Office Air Shielding Protocol' : 'Desk Setup & Natural Workspace Ventilation';
    entry2.badge = isElevated ? 'Indoor Control Active' : 'Natural Airflow';
    entry2.badgeType = isElevated ? 'warning' : 'success';
    entry2.recommendedAction = isElevated
      ? 'Work from a single dedicated room with closed exterior windows. Position your air filter near your desk.'
      : 'Open courtyard windows to allow natural oxygen exchange before beginning morning focus work.';
    entry2.reason = isElevated
      ? 'Working remotely eliminates peak rush-hour roadside exhaust exposure. Controlling your room envelope protects your breathing zone.'
      : 'Clean outdoor air prevents indoor CO2 buildup and morning brain fog.';
    entry2.alternative = 'Take a 5-minute indoor mobility stretch break every hour rather than stepping out onto roadside balconies.';
    entry2.expectedBenefit = 'Eliminates travel-related exhaust exposure while optimizing indoor cognitive alertness.';
    entry2.originalHabit = 'Working from home';
  } else {
    // Essential Commuter (Working Professional, Student, Outdoor Worker)
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
    } else if (isClean) {
      entry2.title = mode === 'walking' || mode === 'bike'
        ? 'Active & Low-Emission Commute Window'
        : `Unrestricted Commute via ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
      entry2.badge = 'Unrestricted Travel';
      entry2.badgeType = 'success';
      entry2.recommendedAction = mode === 'walking' || mode === 'bike'
        ? `Ideal conditions for walking or cycling your ${dist} km route. No mask required.`
        : `Safe and pleasant commute via ${mode}. Vehicle windows may remain open.`;
      entry2.reason = 'Atmospheric particulate dispersion is active. Vehicle emissions dilute rapidly into clear ambient air.';
      entry2.alternative = 'Consider walking or cycling part of your journey for daily physical activity.';
      entry2.expectedBenefit = 'Zero smog inhalation risk while supporting personal physical health and low-carbon urban transit.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else if (cautionLevel === 3) {
      // Moderate
      entry2.title = `Standard Commute with Roadside Awareness (${mode.toUpperCase()})`;
      entry2.badge = 'Roadside Awareness';
      entry2.badgeType = 'info';
      entry2.recommendedAction = mode === 'walking' || mode === 'bike'
        ? 'Select residential secondary streets and protected cycle paths away from heavy bus avenues.'
        : mode === 'car'
        ? 'Keep windows closed in bumper-to-bumper traffic; switch to internal air recirculation.'
        : 'Standard public transit travel. Keep an N95 mask handy if waiting at open-air bus stops.';
      entry2.reason = 'Traffic intersections experience localized accumulation of diesel exhaust particulates and nitrogen dioxide during peak rush hour.';
      entry2.alternative = 'Travel 15 minutes before or after peak congestion to avoid standing in slow-moving traffic queues.';
      entry2.expectedBenefit = 'Avoids concentrated roadside exhaust clouds without requiring drastic schedule disruptions.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    } else {
      // Poor or Severe
      entry2.title = isExtreme
        ? `Emergency Shielded Transit Protocol (${mode.toUpperCase()})`
        : `Shielded Commute & N95 Protection (${mode.toUpperCase()})`;
      entry2.badge = isExtreme ? 'Emergency Transit Barrier' : 'N95 Mask Required';
      entry2.badgeType = isExtreme ? 'alert' : 'warning';

      if (mode === 'car') {
        entry2.recommendedAction = 'Toggle Cabin Air Recirculation ON throughout your drive. Keep all windows firmly closed.';
        entry2.reason = 'Setting vehicle AC to recirculation stops drawing outside diesel exhaust into the cabin, cutting in-car PM2.5 by 75% to 90%.';
        entry2.alternative = 'Wear an N95 mask inside the vehicle if your cabin air filter is unserviced or over 12 months old.';
      } else if (mode === 'metro') {
        entry2.recommendedAction = 'Wear a certified N95/FFP2 mask on open-air platforms and access walkways. Underground train cars maintain filtered air.';
        entry2.reason = 'Modern underground rail cabins filter ambient smog, but open-air elevated platforms remain exposed to ambient winter smog.';
        entry2.alternative = 'Ensure the metal nose clip of your N95 mask is pinched securely against the bridge of your nose.';
      } else {
        // Bus, Two-Wheeler, Walking
        entry2.recommendedAction = isExtreme
          ? 'Wear a certified N95/FFP2 mask tightly sealed. If feasible, consider shifting to closed public transit (Metro).'
          : 'Wear a certified N95 mask with an airtight perimeter seal. Choose secondary residential streets rather than following diesel buses.';
        entry2.reason = 'Cloth and surgical masks do not seal against microscopic PM2.5 particles. Two-wheelers and pedestrians sit directly in the vehicle tailpipe emission plume.';
        entry2.alternative = 'Carpooling in a vehicle with AC recirculation or using public transit cuts exposure significantly compared to open travel.';
      }

      entry2.expectedBenefit = 'Provides a verified physical barrier against toxic combustion byproducts and roadside carcinogens.';
      entry2.originalHabit = `${mode} commute (${dist} km)`;
    }
  }

  timeline.push(entry2);

  // -------------------------------------------------------------------------
  // ENTRY 3: Midday Ventilation & Workspace Environment
  // -------------------------------------------------------------------------
  let entry3 = {
    id: 'routine-step-3',
    time: '01:15 PM – 02:00 PM',
    category: 'Indoor Air & Ventilation',
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
  } else if (isClean) {
    entry3.title = 'Full Natural Home & Workspace Air Exchange';
    entry3.badge = 'Full Open Air Flush';
    entry3.badgeType = 'success';
    entry3.recommendedAction = 'Open opposite windows and balcony doors wide. Allow natural cross-ventilation to thoroughly flush indoor air.';
    entry3.reason = `Outdoor air is pristine (AQI ${aqiResult.aqi}). Natural airflow expels accumulated indoor carbon dioxide, cooking moisture, and VOCs without introducing exterior contaminants.`;
    entry3.alternative = 'Keep windows cracked throughout the afternoon for continuous fresh oxygen replenishment.';
    entry3.expectedBenefit = 'Lowers indoor CO2 below 500 ppm, preventing midday brain fog, headaches, and lethargy.';
    entry3.originalHabit = 'Keeping windows shut';
  } else if (cautionLevel === 3) {
    // Moderate
    entry3.title = 'Controlled Midday Ventilation Window (45 Mins)';
    entry3.badge = 'Controlled Flush (45m)';
    entry3.badgeType = 'info';
    entry3.recommendedAction = 'Open windows for 30–45 minutes during midday solar peak, preferably on courtyard or non-street-facing sides.';
    entry3.reason = 'Thermal convection breaks morning surface stagnation, making late morning to early afternoon the cleanest atmospheric window of the day.';
    entry3.alternative = 'If street traffic dust is visible, limit opening to windows facing away from roadways.';
    entry3.expectedBenefit = 'Refreshes stale indoor oxygen levels while keeping roadside dust intake to a minimum.';
    entry3.originalHabit = 'Uncontrolled window opening';
  } else if (cautionLevel === 4) {
    // Poor
    entry3.title = 'Strict 15-Minute Strategic Cross-Ventilation';
    entry3.badge = 'Restricted Window (15m)';
    entry3.badgeType = 'warning';
    entry3.recommendedAction = 'Limit window opening to a quick 15-minute cross-draft at 1:30 PM on non-roadside windows, then immediately reseal.';
    entry3.reason = 'Solar radiation temporarily dilutes ground-level PM2.5 between 1:00 PM and 2:00 PM. This is your only safe window to flush trapped CO2 before evening stagnation sets in.';
    entry3.alternative = hasPurifier
      ? 'Air out for 15 minutes to flush CO2, then close and run air purifier on High/Turbo for 20 minutes.'
      : 'Keep interior room doors open to circulate air without pulling exterior roadside dust.';
    entry3.expectedBenefit = 'Clears cognitive-draining indoor CO2 buildup without trapping high volumes of ambient smog.';
    entry3.originalHabit = 'Keeping windows shut all day';
  } else {
    // Extreme (Very Poor or Severe)
    entry3.title = 'Zero Exterior Window Opening — Complete Building Envelope Seal';
    entry3.badge = 'Windows Sealed';
    entry3.badgeType = 'alert';
    entry3.recommendedAction = 'Keep all exterior windows and doors firmly shut throughout the day. Do not open windows.';
    entry3.reason = `Outdoor PM2.5 is at hazardous emergency levels (AQI ${aqiResult.aqi}). Opening windows for even 10 minutes will flood indoor rooms with fine soot that settles onto upholstery and carpets.`;
    entry3.alternative = hasPurifier
      ? 'Run HEPA air purifiers continuously on auto/medium mode. Use ceiling fans for circulation.'
      : 'Use DIY Corsi-Rosenthal box fans and seal door gaps with draft stoppers or damp towels.';
    entry3.expectedBenefit = 'Maintains indoor PM2.5 levels at 60% to 80% below the hazardous exterior ambient atmosphere.';
    entry3.originalHabit = 'Opening windows for air';
  }

  timeline.push(entry3);

  // -------------------------------------------------------------------------
  // ENTRY 4: Evening Transition & Decontamination
  // -------------------------------------------------------------------------
  let entry4 = {
    id: 'routine-step-4',
    time: '06:00 PM – 07:00 PM',
    category: 'Home Transition & Hygiene',
    icon: 'ShieldCheck'
  };

  if (isClean) {
    entry4.title = isEveningExerciser ? 'Outdoor Evening Workout / Park Run' : 'Evening Leisure & Outdoor Recreation';
    entry4.badge = 'Pleasant Evening';
    entry4.badgeType = 'success';
    entry4.recommendedAction = isEveningExerciser
      ? 'Great conditions for an evening outdoor run, outdoor sports, or cycling in community parks.'
      : 'Enjoy an evening walk, outdoor dinner, or park recreation. No special decontamination needed.';
    entry4.reason = 'Evening ambient conditions remain clean with active atmospheric mixing and low particulate concentration.';
    entry4.alternative = 'Standard handwashing upon entering.';
    entry4.expectedBenefit = 'Supports physical relaxation and mental recovery after work or study.';
    entry4.originalHabit = 'Returning indoors';
  } else if (cautionLevel === 3) {
    // Moderate
    entry4.title = 'Evening Return & Light Shoe Care';
    entry4.badge = 'Basic Hygiene';
    entry4.badgeType = 'info';
    entry4.recommendedAction = 'Leave street shoes at the entryway and wash hands and face. Evening outdoor walks are fine in parks away from main roads.';
    entry4.reason = 'Evening rush hour increases local street-level dust, but residential neighborhoods remain acceptable.';
    entry4.alternative = 'Wipe down door entrance with a damp cloth every couple of days.';
    entry4.expectedBenefit = 'Prevents tracked road dust from spreading onto living room floors.';
    entry4.originalHabit = 'Walking straight into living space';
  } else if (cautionLevel === 4) {
    // Poor
    entry4.title = 'Entryway Decontamination Protocol';
    entry4.badge = 'Decontamination';
    entry4.badgeType = 'warning';
    entry4.recommendedAction = 'Remove outdoor shoes immediately at the door, change out of outdoor jackets, and wash face and eyes promptly.';
    entry4.reason = 'Winter particulate matter and tire soot cling to clothing, hair, and footwear during evening traffic.';
    entry4.alternative = 'Damp-mop entryway tiles instead of dry sweeping to capture settled dust without resuspending it into the breathing zone.';
    entry4.expectedBenefit = 'Stops outdoor toxic aerosols from contaminating your living room and sleeping quarters.';
    entry4.originalHabit = 'Entering living space in outdoor clothing';
  } else {
    // Extreme (Very Poor / Severe)
    entry4.title = 'Strict Smog Decontamination & Airway Flush';
    entry4.badge = 'Hazard Decontamination';
    entry4.badgeType = 'alert';
    entry4.recommendedAction = 'Immediately strip outdoor outerwear at entrance, wash face, rinse eyes and gargle with warm water/saline. Take a shower if outdoors >30 mins.';
    entry4.reason = 'Severe smog deposits heavy polycyclic aromatic hydrocarbons and acidic aerosols on hair, skin, and clothing during outdoor exposure.';
    entry4.alternative = 'Store outerwear in a closed closet or laundry hamper by the door. Damp-wipe all floor transitions.';
    entry4.expectedBenefit = 'Reduces mucous membrane inflammation, eye stinging, and nighttime allergen triggers.';
    entry4.originalHabit = 'Casual entry in street clothes';
  }

  timeline.push(entry4);

  // -------------------------------------------------------------------------
  // ENTRY 5: Nighttime Rest & Sleep Sanctuary Setup
  // -------------------------------------------------------------------------
  const sleepPrepTime24 = addMinutesTo24Time(profile.sleepTime, -45); // 45 mins before bedtime
  const sleepTimeRange = formatTimeRange(sleepPrepTime24, 45);

  let entry5 = {
    id: 'routine-step-5',
    time: sleepTimeRange,
    category: 'Rest & Recovery',
    icon: 'Moon'
  };

  if (isClean) {
    entry5.title = 'Natural Nighttime Sleep Airflow';
    entry5.badge = 'Natural Fresh Air';
    entry5.badgeType = 'success';
    entry5.recommendedAction = 'Bedroom windows can remain cracked for fresh, cool air circulation during sleep.';
    entry5.reason = 'Nighttime ambient conditions are clean and cool, promoting natural melatonin release and lung recovery.';
    entry5.alternative = 'If outdoor noise is noticeable, close windows and use a standard room fan.';
    entry5.expectedBenefit = 'Prevents CO2 accumulation and delivers deep, restorative sleep.';
    entry5.originalHabit = 'Sleeping with closed windows';
  } else if (cautionLevel === 3) {
    // Moderate
    entry5.title = 'Bedroom Wind-Down & Protected Rest';
    entry5.badge = 'Protected Rest';
    entry5.badgeType = 'info';
    entry5.recommendedAction = 'Close street-facing windows before sleep. Keep bedroom door slightly ajar to balance indoor airflow.';
    entry5.reason = 'Nighttime cooling causes surface air to settle, slowly increasing localized road exhaust concentrations near street level.';
    entry5.alternative = hasPurifier
      ? 'Run air purifier on silent/sleep mode.'
      : 'Ensure windows are shut and clean sheets are free of outdoor dust.';
    entry5.expectedBenefit = 'Ensures undisturbed 7–8 hours of restful sleep without coughing or dry throat.';
    entry5.originalHabit = 'Sleeping without checking windows';
  } else if (cautionLevel === 4) {
    // Poor
    entry5.title = hasPurifier ? 'Sealed Bedroom & Air Purifier Sleep Mode' : 'Draft-Protected Bedroom Sanctuary';
    entry5.badge = hasPurifier ? 'HEPA Sleep Mode' : 'Low-Cost Draft Seal';
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
  } else {
    // Extreme (Very Poor / Severe)
    entry5.title = 'High-Integrity Sleep Sanctuary Enclosure';
    entry5.badge = 'Critical Sleep Shield';
    entry5.badgeType = 'alert';
    entry5.recommendedAction = hasPurifier
      ? 'Complete bedroom seal. Place air purifier on continuous medium/high mode 45 mins before bedtime, then switch to quiet night mode.'
      : 'Complete bedroom envelope seal. Place damp towels along all exterior door and window crevices to stop toxic draft infiltration.';
    entry5.reason = `Dangerous nocturnal smog levels (${aqiResult.category}) penetrate loose window gaskets. Breathing severe smog during sleep causes nocturnal bronchospasms and microvascular stress.`;
    entry5.alternative = hasPurifier
      ? 'Position purifier directly in the breathing zone path. Ensure zero drafts.'
      : 'Tape window seams with masking tape and use DIY Corsi-Rosenthal unit if available.';
    entry5.expectedBenefit = 'Creates a safe micro-environment where lung tissue can recover from daytime toxic aerosol exposures.';
    entry5.originalHabit = 'Sleeping with standard drafts';
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
