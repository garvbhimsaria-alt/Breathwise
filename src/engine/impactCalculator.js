/**
 * BreatheWise Sustainable Commute & Environmental Impact Calculator
 * 
 * Provides defensible, transparent estimates of emissions avoided when shifting
 * from private solo vehicle travel to sustainable urban transit modes.
 * 
 * Important Methodological Boundary:
 * Environmental emissions reductions represent collective atmospheric benefits,
 * NOT a direct measurement of personal health improvement or lung deposition.
 */

// Published Urban Passenger Transit Emission Factors (ARAI / CPCB / IPCC benchmarks)
export const TRANSIT_EMISSION_BENCHMARKS = {
  // Solo-occupancy petrol passenger car (Default displacement baseline)
  car: {
    key: 'car',
    label: 'Private Car (Solo Petrol)',
    co2PerPassengerKm: 140.0, // grams CO2 per passenger-km
    pmPerPassengerKm: 0.028,   // grams PM2.5/PM10 per passenger-km (exhaust + brake/tire wear)
    source: 'IPCC & ARAI urban private passenger vehicle fleet average'
  },
  // Two-Wheeler (Motorcycle / Scooter)
  twowheeler: {
    key: 'twowheeler',
    label: 'Motorcycle / Scooter',
    co2PerPassengerKm: 45.0,
    pmPerPassengerKm: 0.015,
    source: 'ARAI two-wheeler average fleet efficiency'
  },
  // Municipal Public Bus (CNG / Diesel average occupancy ~35 passengers)
  bus: {
    key: 'bus',
    label: 'Public Bus',
    co2PerPassengerKm: 68.0,
    pmPerPassengerKm: 0.018,
    source: 'Urban bus transit lifecycle assessment (average load factor ~35 pax)'
  },
  // Urban Electric Metro / Rail (Grid-powered per passenger-km)
  metro: {
    key: 'metro',
    label: 'Metro / Electric Rail',
    co2PerPassengerKm: 32.0,
    pmPerPassengerKm: 0.002, // Near-zero direct street PM
    source: 'Urban electric mass transit grid-draw displacement model'
  },
  // Carpool (2+ passengers sharing a car)
  carpool: {
    key: 'carpool',
    label: 'Carpooling (Shared Ride)',
    co2PerPassengerKm: 70.0,
    pmPerPassengerKm: 0.014,
    source: '50% displacement model based on average 2-passenger car occupancy'
  },
  // Active Mobility: Walking or Bicycle
  walking: {
    key: 'walking',
    label: 'Walking / Bicycle',
    co2PerPassengerKm: 0.0,
    pmPerPassengerKm: 0.0,
    source: 'Zero direct tailpipe operational emissions'
  },
  cycling: {
    key: 'cycling',
    label: 'Bicycle / Cycling',
    co2PerPassengerKm: 0.0,
    pmPerPassengerKm: 0.0,
    source: 'Zero direct tailpipe operational emissions'
  },
  // Work from Home (WFH)
  wfh: {
    key: 'wfh',
    label: 'Work From Home (Zero Commute)',
    co2PerPassengerKm: 0.0,
    pmPerPassengerKm: 0.0,
    source: 'Complete trip displacement model'
  }
};

/**
 * Calculates estimated emissions avoided when choosing a sustainable transit mode over a baseline car trip.
 * 
 * @param {string} mode - Chosen transit mode (metro, bus, twowheeler, carpool, walking, wfh)
 * @param {number|string} distanceKm - Travel distance in kilometers
 * @param {string} [baselineMode='car'] - Comparison baseline (defaults to private solo car)
 * @returns {Object} Structured calculation result with validation, metrics, and methodology notes
 */
export function calculateCommuteImpact(mode, distanceKm, baselineMode = 'car') {
  // 1. Validate distance input
  const distance = Number(distanceKm);
  if (distanceKm === null || distanceKm === undefined || distanceKm === '' || Number.isNaN(distance) || distance <= 0) {
    return {
      valid: false,
      error: 'Invalid or missing distance. Distance must be a positive number of kilometers.',
      co2AvoidedKg: null,
      pmAvoidedGrams: null,
      co2EmittedKg: null,
      percentReduction: null,
      isEstimate: true,
      methodologyNote: 'Calculations require a valid trip distance in kilometers.'
    };
  }

  // 2. Resolve mode configurations
  const normalizedMode = String(mode).toLowerCase().replace(/[\s-_]/g, '');
  const modeKey = normalizedMode === 'bike' ? 'twowheeler' : (TRANSIT_EMISSION_BENCHMARKS[normalizedMode] ? normalizedMode : 'metro');
  const chosenConfig = TRANSIT_EMISSION_BENCHMARKS[modeKey] || TRANSIT_EMISSION_BENCHMARKS.metro;
  const baselineConfig = TRANSIT_EMISSION_BENCHMARKS[baselineMode] || TRANSIT_EMISSION_BENCHMARKS.car;

  // 3. Compute emissions
  const baselineCo2G = baselineConfig.co2PerPassengerKm * distance;
  const baselinePmG = baselineConfig.pmPerPassengerKm * distance;

  const modeCo2G = chosenConfig.co2PerPassengerKm * distance;
  const modePmG = chosenConfig.pmPerPassengerKm * distance;

  const co2AvoidedG = Math.max(0, baselineCo2G - modeCo2G);
  const pmAvoidedG = Math.max(0, baselinePmG - modePmG);

  const co2AvoidedKg = Number((co2AvoidedG / 1000).toFixed(2));
  const pmAvoidedGrams = Number(pmAvoidedG.toFixed(3));
  const co2EmittedKg = Number((modeCo2G / 1000).toFixed(2));

  const percentReduction = baselineCo2G > 0
    ? Math.round((co2AvoidedG / baselineCo2G) * 100)
    : 0;

  return {
    valid: true,
    distanceKm: distance,
    mode: modeKey,
    modeLabel: chosenConfig.label,
    baselineMode: baselineMode,
    baselineLabel: baselineConfig.label,
    co2AvoidedKg: co2AvoidedKg,
    pmAvoidedGrams: pmAvoidedGrams,
    co2EmittedKg: co2EmittedKg,
    percentReduction: percentReduction,
    isEstimate: true,
    methodologyNote: 'Estimates calculated using standardized average urban passenger transport factors (IPCC / ARAI / CPCB). These are mathematical estimates of displaced environmental emissions, not measured vehicle telemetry or direct personal health measurements.'
  };
}

/**
 * Returns a comparative matrix across all supported transit modes for a given distance.
 * 
 * @param {number|string} distanceKm - Trip distance in km
 * @returns {Array<Object>|null} List of comparison rows across transit modes
 */
export function compareAllCommuteModes(distanceKm) {
  const distance = Number(distanceKm);
  if (Number.isNaN(distance) || distance <= 0) return null;

  const modes = ['walking', 'metro', 'bus', 'carpool', 'twowheeler', 'car'];
  return modes.map(m => calculateCommuteImpact(m, distance, 'car'));
}
