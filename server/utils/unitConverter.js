/**
 * BreatheWise — Pollutant Unit Converter
 *
 * Implements standard physical and regulatory conversions between volumetric
 * mixing ratios (ppb, ppm) and mass concentrations (µg/m³, mg/m³) for gaseous
 * air pollutants under standard Indian CPCB conditions:
 *   - Reference Temperature: 25 °C (298.15 K)
 *   - Reference Pressure: 1 atmosphere (101.325 kPa)
 *   - Standard Molar Volume of Ideal Gas (Vm): 24.45 L/mol (24.454 L/mol)
 *
 * Formula:
 *   Concentration (µg/m³) = Concentration (ppb) × (Molecular Weight / 24.45)
 *   Concentration (mg/m³) = Concentration (ppm) × (Molecular Weight / 24.45)
 *
 * References:
 *   - CPCB Technical Guidelines for CAAQMS & National AQI (MoEFCC)
 *   - WHO Air Quality Guidelines & US EPA 40 CFR Part 50
 */

// Molecular weights (g/mol) for common regulated gaseous pollutants
export const MOLECULAR_WEIGHTS = {
  no2: 46.01,   // Nitrogen Dioxide
  so2: 64.07,   // Sulfur Dioxide
  co:  28.01,   // Carbon Monoxide
  o3:  48.00,   // Ozone
  nh3: 17.03    // Ammonia
};

// Standard molar volume of ideal gas at 25 °C and 1 atm (L/mol)
export const STANDARD_MOLAR_VOLUME_L = 24.45;

/**
 * Standard CPCB target units for each pollutant in sub-index calculations:
 *   - PM2.5, PM10, NO2, SO2, O3, NH3 → µg/m³
 *   - CO → mg/m³
 */
export const TARGET_CPCB_UNITS = {
  pm25: 'µg/m³',
  pm10: 'µg/m³',
  no2:  'µg/m³',
  so2:  'µg/m³',
  co:   'mg/m³',
  o3:   'µg/m³',
  nh3:  'µg/m³'
};

/**
 * Normalise a unit string into a standard canonical form.
 *
 * @param {string} unit - Raw unit string, e.g. "ug/m3", "ppb", "mg/m^3"
 * @returns {string} - Canonical unit identifier: 'ug/m3' | 'mg/m3' | 'ppb' | 'ppm' | null
 */
export function normaliseUnit(unit) {
  if (!unit || typeof unit !== 'string') return null;
  const clean = unit.trim().toLowerCase().replace(/\s+/g, '');

  if (clean === 'µg/m³' || clean === 'ug/m3' || clean === 'ug/m^3' || clean === 'µg/m3' || clean === 'micrograms/m3') {
    return 'ug/m3';
  }
  if (clean === 'mg/m³' || clean === 'mg/m3' || clean === 'mg/m^3' || clean === 'milligrams/m3') {
    return 'mg/m3';
  }
  if (clean === 'ppb' || clean === 'parts per billion') {
    return 'ppb';
  }
  if (clean === 'ppm' || clean === 'parts per million') {
    return 'ppm';
  }

  return null; // Unsupported / unrecognised unit
}

/**
 * Convert a measured concentration of a pollutant to its CPCB target unit.
 *
 * @param {string} pollutantId - e.g. 'no2', 'pm25', 'co'
 * @param {number} value - Measured numeric concentration
 * @param {string|null} fromUnit - Raw unit string, e.g. 'ppb', 'µg/m³', 'mg/m³'
 * @returns {{ value: number, targetUnit: string, originalUnit: string, converted: boolean } | null}
 *          Returns null if the unit is unsupported or incompatible (e.g. ppb for PM2.5).
 */
export function convertToCpcbUnit(pollutantId, value, fromUnit) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return null;
  }

  const numValue = Number(value);
  if (numValue < 0) return null; // Concentrations cannot be negative

  const id = String(pollutantId).toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetCpcbUnit = TARGET_CPCB_UNITS[id];
  if (!targetCpcbUnit) return null; // Unknown pollutant

  // If no unit provided, assume standard target unit by default
  if (!fromUnit) {
    return {
      value: numValue,
      targetUnit: targetCpcbUnit,
      originalUnit: targetCpcbUnit,
      converted: false
    };
  }

  const canonUnit = normaliseUnit(fromUnit);
  if (!canonUnit) {
    // Unsupported / unrecognised unit: reject to prevent silent data corruption
    return null;
  }

  // --- Particulate Pollutants (PM2.5, PM10) ---
  if (id === 'pm25' || id === 'pm10') {
    if (canonUnit === 'ug/m3') {
      return { value: numValue, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: false };
    }
    if (canonUnit === 'mg/m3') {
      // 1 mg/m³ = 1000 µg/m³
      return { value: numValue * 1000, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: true };
    }
    // Particulates cannot be converted from volumetric ratios (ppb/ppm) without particle density/size
    return null;
  }

  // --- Carbon Monoxide (CO) — Target is mg/m³ ---
  if (id === 'co') {
    const mw = MOLECULAR_WEIGHTS.co; // 28.01
    if (canonUnit === 'mg/m3') {
      return { value: numValue, targetUnit: 'mg/m³', originalUnit: fromUnit, converted: false };
    }
    if (canonUnit === 'ug/m3') {
      // 1000 µg/m³ = 1 mg/m³
      return { value: numValue / 1000, targetUnit: 'mg/m³', originalUnit: fromUnit, converted: true };
    }
    if (canonUnit === 'ppm') {
      // 1 ppm CO = (28.01 / 24.45) mg/m³ ≈ 1.1456 mg/m³
      const inMg = numValue * (mw / STANDARD_MOLAR_VOLUME_L);
      return { value: inMg, targetUnit: 'mg/m³', originalUnit: fromUnit, converted: true };
    }
    if (canonUnit === 'ppb') {
      // 1000 ppb = 1 ppm
      const inMg = (numValue / 1000) * (mw / STANDARD_MOLAR_VOLUME_L);
      return { value: inMg, targetUnit: 'mg/m³', originalUnit: fromUnit, converted: true };
    }
    return null;
  }

  // --- Gaseous Pollutants with Target unit µg/m³ (NO2, SO2, O3, NH3) ---
  const mw = MOLECULAR_WEIGHTS[id];
  if (!mw) return null;

  if (canonUnit === 'ug/m3') {
    return { value: numValue, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: false };
  }
  if (canonUnit === 'mg/m3') {
    // 1 mg/m³ = 1000 µg/m³
    return { value: numValue * 1000, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: true };
  }
  if (canonUnit === 'ppb') {
    // Concentration (µg/m³) = ppb × (MW / 24.45)
    // For NO2: 87 ppb × (46.01 / 24.45) ≈ 163.72 µg/m³
    const inUg = numValue * (mw / STANDARD_MOLAR_VOLUME_L);
    return { value: inUg, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: true };
  }
  if (canonUnit === 'ppm') {
    // 1 ppm = 1000 ppb
    const inUg = (numValue * 1000) * (mw / STANDARD_MOLAR_VOLUME_L);
    return { value: inUg, targetUnit: 'µg/m³', originalUnit: fromUnit, converted: true };
  }

  return null;
}
