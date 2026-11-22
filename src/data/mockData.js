// BreatheWise Mock Data & Knowledge Base
// All data is clearly labelled as sample/demonstration data until live providers are integrated.
export { classifyAqi as getAqiCategory } from '../engine/aqiClassifier.js';

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

// Standard AQI Demonstration Scenarios according to India's CPCB Standards
export const SCENARIO_PRESETS = [
  {
    id: 'good',
    label: 'Good',
    aqi: 35,
    category: 'Good',
    pm25: 15.0,
    pm10: 28.0,
    no2: 12.0,
    temp: 22,
    humidity: 55,
    primaryPollutant: 'O3',
    color: '#10B981',
    desc: 'CPCB 0–50 • Clean Air, Unrestricted'
  },
  {
    id: 'satisfactory',
    label: 'Satisfactory',
    aqi: 75,
    category: 'Satisfactory',
    pm25: 42.0,
    pm10: 78.0,
    no2: 25.0,
    temp: 24,
    humidity: 58,
    primaryPollutant: 'PM10',
    color: '#84CC16',
    desc: 'CPCB 51–100 • Minor Sensitive Discomfort'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    aqi: 145,
    category: 'Moderate',
    pm25: 75.0,
    pm10: 165.0,
    no2: 44.0,
    temp: 21,
    humidity: 62,
    primaryPollutant: 'PM2.5',
    color: '#F59E0B',
    desc: 'CPCB 101–200 • Caution Near Traffic'
  },
  {
    id: 'poor',
    label: 'Poor',
    aqi: 245,
    category: 'Poor',
    pm25: 108.0,
    pm10: 290.0,
    no2: 62.0,
    temp: 18,
    humidity: 65,
    primaryPollutant: 'PM2.5',
    color: '#EA580C',
    desc: 'CPCB 201–300 • Shift Cardio Indoors'
  },
  {
    id: 'very_poor',
    label: 'Very Poor',
    aqi: 345,
    category: 'Very Poor',
    pm25: 185.0,
    pm10: 380.0,
    no2: 72.0,
    temp: 16,
    humidity: 68,
    primaryPollutant: 'PM2.5',
    color: '#DC2626',
    desc: 'CPCB 301–400 • N95 Mask Mandatory'
  },
  {
    id: 'severe',
    label: 'Severe',
    aqi: 440,
    category: 'Severe',
    pm25: 280.0,
    pm10: 460.0,
    no2: 85.0,
    temp: 14,
    humidity: 72,
    primaryPollutant: 'PM2.5',
    color: '#7F1D1D',
    desc: 'CPCB 401–500 • Strict Building Seal'
  },
  {
    id: 'missing',
    label: 'Data Offline',
    aqi: null,
    category: 'Data Unavailable',
    pm25: null,
    pm10: null,
    no2: null,
    temp: 19,
    humidity: 60,
    primaryPollutant: 'Unknown',
    color: '#6B878D',
    desc: 'Simulate Sensor Failure / Missing Data'
  },
  {
    id: 'stale',
    label: 'Outdated Data',
    aqi: 180,
    category: 'Moderate',
    pm25: 82.0,
    pm10: 175.0,
    no2: 45.0,
    temp: 20,
    humidity: 62,
    primaryPollutant: 'PM2.5',
    color: '#F59E0B',
    isStale: true,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    desc: 'Simulate Stale Reading (4 hrs old)'
  }
];

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
  healthSensitivity: 'none', // 'none', 'mild_asthma', 'sensitive_throat', 'senior_household', 'child_at_home'
  wakeUpTime: '06:30',
  sleepTime: '22:30',
  hasCompletedOnboarding: true
};

// AI Assistant Knowledge Base for Suggested Questions and Offline Fallbacks
export const AI_SUGGESTED_QUESTIONS = [
  'How should I plan my day when AQI is high?',
  'Should I go running today?',
  'How can I improve indoor air quality without an air purifier?',
  'What precautions should I take during my commute?',
  'How can I reduce my contribution to air pollution?',
  'Why did BreatheWise recommend changing my morning routine?'
];

export const AI_KNOWLEDGE_BASE = {
  // Conversational Intent: Greetings
  greeting: {
    title: 'Hello from BreatheWise',
    response: (name) => `Hey ${name || 'there'}! Welcome to BreatheWise.

How can I help you today? You can ask me about current air quality, pollution health impacts, your daily routine, or practical ways to reduce exposure.`
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

Before heading out, be sure to check the **Daily Routine** tab for your personalized timeline updates. Stay safe and have a healthy day!`
  },

  // Conversational Intent: Capabilities / Identity
  identity: {
    title: 'About BreatheWise & Capabilities',
    response: () => `I am **BreatheWise**, your personal air-quality and daily routine companion. My purpose is to help individuals and families navigate urban air pollution through science-backed, actionable guidance.

Here is what I can do:
1. **Personalized Daily Routines:** Restructures workouts, commute strategies, and ventilation around diurnal smog cycles.
2. **Exercise Guidance:** Evaluates particulate levels to determine whether outdoor cardio is safe or if indoor alternatives are advised.
3. **Indoor Air Optimization:** Room-by-room guidance on kitchen exhaust, damp-mopping, ventilation windows, and air purifiers.
4. **Commuter Protection:** Specific precautions for cars (AC recirculation), metro transit, two-wheelers, and certified N95 respirators.
5. **Sustainable Impact:** Tracks and estimates your personal avoided carbon (CO2) and particulate (PM) emissions.

Ask me a question or tap any of the suggested prompts above!`
  },

  // General Knowledge: What is AQI?
  what_is_aqi: {
    title: 'Understanding the Air Quality Index (AQI)',
    response: () => `The **Air Quality Index (AQI)** is a standardized number used by government environmental agencies to communicate how clean or polluted ambient air is.

In India, the Central Pollution Control Board (CPCB) classifies AQI into 6 categories:
- **0–50 (Good):** Minimal health impact; pristine air.
- **51–100 (Satisfactory):** Minor breathing discomfort may develop in unusually sensitive individuals.
- **101–200 (Moderate):** Discomfort for people with lung/heart disease, children, and older adults.
- **201–300 (Poor):** Breathing discomfort to most people on prolonged exposure.
- **301–400 (Very Poor):** Risk of respiratory illness on prolonged exposure.
- **401–500+ (Severe):** Affects healthy individuals and seriously impacts those with existing conditions.

AQI transforms complex pollutant measurements (PM2.5, PM10, NO2, SO2, CO, O3) into a single, actionable public health metric.`
  },

  // General Knowledge: What is PM2.5?
  what_is_pm25: {
    title: 'What is PM2.5 and Why is it Dangerous?',
    response: () => `**PM2.5** refers to fine atmospheric particulate matter with an aerodynamic diameter smaller than **2.5 micrometers**—roughly 30 times thinner than a single strand of human hair.

**Why PM2.5 is Dangerous:**
1. **Bypasses Natural Defenses:** Unlike larger dust particles, PM2.5 easily bypasses nasal hairs and mucus membranes.
2. **Deep Alveolar Penetration:** It travels deep into pulmonary alveoli where oxygen exchanges into blood.
3. **Enters the Bloodstream:** Micro-particulates can cross the alveolar-capillary barrier directly into blood circulation, contributing to systemic vascular inflammation, arterial plaque instability, and cardiovascular stress.

Common sources include vehicle exhaust (especially diesel), biomass burning, crop residue smoke, industrial emissions, and coal combustion.`
  },

  // General Knowledge: What is PM10?
  what_is_pm10: {
    title: 'What is PM10 (Coarse Particulate Matter)?',
    response: () => `**PM10** refers to inhalable particles with diameters between **2.5 and 10 micrometers**.

Common sources include:
- Road dust and construction debris.
- Windblown soil and agricultural tilling.
- Pollen and mold spores.
- Brake and tire friction wear from vehicles.

While less prone to entering the bloodstream than PM2.5, PM10 irritates the upper respiratory tract, eyes, and throat, triggering coughing, wheezing, and allergic rhinitis.`
  },

  // General Knowledge: What is Smog?
  what_is_smog: {
    title: 'What is Smog and How Does it Form?',
    response: () => `**Smog** is a blend of "smoke" and "fog". In urban winter settings, it forms through a combination of emissions and meteorological conditions:

1. **Emission Sources:** Heavy vehicle exhaust, industrial fumes, power plant emissions, construction dust, and open burning release particulate matter and gases.
2. **Thermal Inversion:** During cold, still winter nights, the ground cools rapidly. A layer of cold, heavy air gets trapped beneath a layer of warm air.
3. **The "Lid" Effect:** The warm air layer acts like a ceiling. Emissions cannot rise into the upper atmosphere and stay concentrated within 50 to 100 meters of the ground where we breathe.
4. **Photochemical Reactions:** Sunlight interacts with nitrogen oxides (NOx) and volatile organic compounds (VOCs) to create secondary fine aerosols and ground-level ozone.`
  },

  // Health: Lungs and Respiratory System
  lungs_health: {
    title: 'How Air Pollution Affects the Lungs',
    response: () => `Breathing polluted air directly challenges pulmonary tissue:

1. **Airway Inflammation:** Acidic aerosols and oxidants irritate the bronchial lining, causing swelling, mucus overproduction, and airway narrowing.
2. **Reduced Lung Capacity:** Chronic exposure gradually reduces forced expiratory volume, particularly in developing children and seniors.
3. **Asthma & Bronchitis Flare-ups:** Micro-particles trigger rapid bronchospasms, increasing the frequency of asthma attacks.
4. **Impaired Cilia Function:** Particulates overwhelm the microscopic cilia that sweep foreign matter out of your lungs.

**Key Precaution:** Wear a certified N95 respirator during high-AQI transit and avoid vigorous outdoor cardio during morning thermal inversions.`
  },

  // Health: Heart and Cardiovascular System
  heart_health: {
    title: 'How Air Pollution Impacts Heart Health',
    response: () => `Cardiovascular effects are one of the most serious consequences of severe urban air pollution:

1. **Systemic Inflammation:** Ultra-fine particles entering the bloodstream trigger systemic oxidative stress, promoting arterial wall inflammation.
2. **Elevated Blood Pressure:** Autonomic nervous system reflexes triggered by inhaled pollutants cause microvascular constriction, raising arterial blood pressure.
3. **Arterial Plaque Vulnerability:** Inflammatory responses can destabilize atherosclerotic plaques, increasing the risk of acute coronary events.
4. **Heart Rate Variability:** Studies show reduced heart rate variability during heavy smog exposure, indicating autonomic imbalance.

**Key Advice:** Individuals with diagnosed hypertension or coronary disease should strictly avoid outdoor morning exertion during Poor to Severe AQI events.`
  },

  // Health: Diet and Hydration Guidance
  high_pollution_diet: {
    title: 'Nutrition & Hydration Guidance During Pollution Episodes',
    response: () => `While diet cannot replace clean air or certified respiratory protection, sound nutrition supports the body's natural defenses against oxidative stress:

1. **Adequate Hydration:** Drink plenty of water and warm fluids. Well-hydrated mucous membranes trap and expel inhaled dust more effectively than dry airways.
2. **Antioxidant-Rich Foods:** Incorporate seasonal fruits and vegetables rich in Vitamin C (citrus, amla, guava) and Vitamin E (nuts, seeds) to help combat cellular oxidative stress.
3. **Anti-Inflammatory Spices:** Warm turmeric milk, ginger tea, and tulsi can help soothe throat irritation and coughs.
4. **Avoid Heavy, Greasy Meals:** Heavy foods divert energy to digestion. Wholesome, home-cooked meals support general immunity.

*Note: Nutrition supports internal recovery, but does not filter inhaled smog. Always prioritize physical barriers like N95 masks and clean indoor environments.*`
  },

  // Emergency: What to do during Severe AQI?
  severe_aqi_guidance: {
    title: 'Action Protocol for Severe AQI (401–500+)',
    response: () => `When air quality reaches **Severe**, health risks apply to both healthy adults and vulnerable groups. Follow this action protocol:

1. **Avoid Non-Essential Outdoor Movement:** Strictly postpone non-essential outdoor physical activity, sports, and runs.
2. **Wear an N95/FFP2 Mask for Essential Travel:** Ensure the metal nose clip is pinched securely against the bridge of your nose with an airtight perimeter seal.
3. **Keep Vehicle Air on Recirculation:** If driving or cabbing, turn off fresh air intake and set cabin AC to **Recirculation**.
4. **Manage Indoor Spaces:** Keep exterior windows closed. Run a HEPA air purifier in your primary living or sleeping area. If you do not own a purifier, place damp towels along exterior door gaps.
5. **Decontaminate on Return:** Remove outerwear at the entrance, wash your face and eyes with clean water, and gargle with warm water.
6. **Follow Official Advisories:** Check local government pollution control announcements regarding school schedules, construction restrictions, and work-from-home guidelines.`
  },

  // Suggested Prompt 1: Plan Day High AQI
  plan_day_high_aqi: {
    title: 'Comprehensive Daily Smog Blueprint',
    response: () => `When ambient AQI is elevated (Poor, Very Poor, or Severe), daily personal exposure can be halved by planning around atmospheric cycles:

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
    response: (name, city, aqi, aqiCategory) => {
      const aqiNum = Number(aqi);
      return `Here is your exercise safety assessment for **${city?.name || 'your location'}** (${aqi ? `Current AQI: **${aqi}** — *${aqiCategory}*` : 'Air quality data is currently offline'}):

**Direct Recommendation:**
${!aqi || Number.isNaN(aqiNum)
  ? '⚠️ **Precautionary Indoor Exercise Recommended.** Sensor data is offline. Since unmonitored winter morning smog often traps cold surface soot, indoor workouts are the safest choice.'
  : aqiNum <= 50 
  ? '✅ **Fully Safe for Outdoor Exercise (Good Air).** Air quality is clean. Enjoy outdoor running, cycling, or field sports without restriction.'
  : aqiNum <= 100
  ? '✅ **Outdoor Exercise Suitable (Satisfactory Air).** Safe for the general public. Individuals with sensitive airways should monitor for minor throat dryness.'
  : aqiNum <= 200
  ? '⚠️ **Outdoor Exercise Allowed with Route Caution (Moderate Air).** Safe in green parks away from busy traffic arteries. Sensitive individuals should moderate intensity by 20%.'
  : aqiNum <= 300
  ? '🛑 **Shift Strenuous Cardio Indoors (Poor Air).** Heavy outdoor running or cycling is not advised. During vigorous exercise, your minute ventilation jumps 10x to 20x, pulling PM2.5 deep into pulmonary alveoli where it cannot be coughed out.'
  : aqiNum <= 400
  ? '🛑 **Pause Outdoor Aerobic Exertion (Very Poor Air).** Heavy breathing outdoors triggers acute respiratory inflammation. Shift to indoor conditioning with windows closed.'
  : '🚨 **Avoid Non-Essential Outdoor Exertion (Severe Emergency Air).** Dangerous pollution levels. Follow official local health advisories. Avoid outdoor physical exertion and keep indoor movement gentle in a clean room.'}

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
   Taking the metro or bus instead of driving a private petrol car avoids roughly **108 grams of CO2 and crucial grams of NOx/PM per kilometer**. Check the **My Impact** tab to calculate your savings!

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
export const INITIAL_IMPACT_LOGS = [
  {
    id: 'log-1',
    date: 'Today',
    mode: 'metro',
    modeName: 'Metro Transit',
    distanceKm: 14,
    co2SavedKg: 1.51,
    pmSavedG: 0.36,
    notes: 'Morning & evening commute via Line 2'
  },
  {
    id: 'log-2',
    date: 'Yesterday',
    mode: 'carpool',
    modeName: 'Carpooling',
    distanceKm: 12,
    co2SavedKg: 0.84,
    pmSavedG: 0.17,
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
