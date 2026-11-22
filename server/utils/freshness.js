/**
 * BreatheWise — Freshness & Normalisation Utilities
 *
 * Configurable freshness thresholds (in minutes):
 *   fresh       : < 90 min
 *   stale       : 90 min – 240 min (4 hrs)
 *   very_stale  : 240 min – 1440 min (24 hrs)
 *   unavailable : > 1440 min or missing timestamp
 */

export const FRESHNESS_THRESHOLDS = {
  FRESH_MAX_MIN:      90,     // < 90 minutes
  STALE_MAX_MIN:      240,    // < 4 hours
  VERY_STALE_MAX_MIN: 1440    // < 24 hours
};

/**
 * Parses timestamps safely, including Indian CPCB format (DD-MM-YYYY HH:mm:ss in IST).
 */
export function parseTimestamp(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;

  const str = String(ts).trim();
  const dmyMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    const [, d, m, y, h = '0', min = '0', s = '0'] = dmyMatch;
    // CPCB timestamps are recorded in Indian Standard Time (UTC+05:30)
    const isoString = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:${s.padStart(2, '0')}+05:30`;
    const dt = new Date(isoString);
    if (!isNaN(dt.getTime())) return dt;
  }

  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Evaluate the freshness of a measurement timestamp.
 *
 * @param {string|Date|null} measurementTimestamp – ISO-8601 string or Date
 * @returns {{ status: string, ageMinutes: number|null, label: string }}
 */
export function evaluateFreshness(measurementTimestamp) {
  if (!measurementTimestamp) {
    return { status: 'unavailable', ageMinutes: null, label: 'Timestamp unknown' };
  }

  const measureDate = parseTimestamp(measurementTimestamp);
  if (!measureDate) {
    return { status: 'unavailable', ageMinutes: null, label: 'Invalid timestamp' };
  }

  const ageMs = Date.now() - measureDate.getTime();
  const ageMin = Math.floor(ageMs / 60000);

  if (ageMin < 0) {
    return { status: 'fresh', ageMinutes: 0, label: 'Just now' };
  }

  if (ageMin < FRESHNESS_THRESHOLDS.FRESH_MAX_MIN) {
    return { status: 'fresh', ageMinutes: ageMin, label: `${ageMin} min ago` };
  }

  if (ageMin < FRESHNESS_THRESHOLDS.STALE_MAX_MIN) {
    const hrs = (ageMin / 60).toFixed(1);
    return { status: 'stale', ageMinutes: ageMin, label: `${hrs} hrs ago (Stale)` };
  }

  if (ageMin < FRESHNESS_THRESHOLDS.VERY_STALE_MAX_MIN) {
    const hrs = Math.floor(ageMin / 60);
    return { status: 'very_stale', ageMinutes: ageMin, label: `${hrs} hrs ago (Very stale)` };
  }

  const days = Math.floor(ageMin / 1440);
  return { status: 'unavailable', ageMinutes: ageMin, label: `${days}+ days ago (Unavailable)` };
}

/**
 * Compute distance in km between two lat/lon points (Haversine formula).
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
