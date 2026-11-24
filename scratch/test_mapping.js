import { normaliseParam } from '../server/services/openaqService.js';

// Mock location metadata (as returned by /locations/{id})
const loc = {
  id: 9999,
  name: 'Test Station',
  coordinates: { latitude: 28.6, longitude: 77.2 },
  country: { code: 'IN' },
  providers: [{ name: 'CPCB' }],
  sensors: [
    { id: 1, parameter: { name: 'pm25', units: 'µg/m³' } },
    { id: 2, parameter: { name: 'no2', units: 'ppb' } }
  ]
};

// Mock latest response (flat results array)
const latestJson = {
  results: [
    { sensorsId: 1, value: 55, datetime: { utc: '2026-11-24T10:00:00Z' } },
    { sensorsId: 2, value: 30, datetime: { utc: '2026-11-24T10:00:05Z' } }
  ]
};

// Build sensors array (metadata only)
const sensors = (loc.sensors || []).map(s => ({
  id: s.id,
  parameter: s.parameter?.name ?? null,
  parameterId: s.parameter?.id ?? null,
  unit: s.parameter?.units || null,
  lastValue: null,
  lastUpdated: null
}));

// Map measurements by sensor id (handle sensorsId or sensorId)
const measBySensor = new Map();
const measurements = latestJson.results || [];
for (const m of measurements) {
  const sid = m.sensorsId ?? m.sensorId;
  if (sid != null) {
    measBySensor.set(sid, {
      value: m.value,
      timestamp: m.datetime?.utc || null
    });
  }
}

// Attach latest values to sensors (unit stays from metadata)
for (const s of sensors) {
  const meas = measBySensor.get(s.id);
  if (meas) {
    s.lastValue = meas.value;
    s.lastUpdated = meas.timestamp;
    // No unit overwrite – keep s.unit from metadata
  }
}

// Build pollutants map
const pollutants = {};
let latestTimestamp = null;
for (const s of sensors) {
  if (s.lastValue === null || s.parameter === null) continue;
  const normalised = normaliseParam(s.parameter);
  if (normalised) {
    pollutants[normalised] = {
      value: s.lastValue,
      unit: s.unit,
      timestamp: s.lastUpdated
    };
    if (s.lastUpdated && (!latestTimestamp || new Date(s.lastUpdated) > new Date(latestTimestamp))) {
      latestTimestamp = s.lastUpdated;
    }
  }
}

console.log(JSON.stringify({ pollutants, latestTimestamp }, null, 2));
