import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickBestStation } from '../src/services/aqiApiClient.js';
import { calculateSubIndex } from '../server/utils/aqiCalculator.js';

describe('OpenAQ live station selection', () => {
  it('chooses the nearest usable reading before pollutant coverage', () => {
    const result = pickBestStation({ dataType:'live_measurements', stations:[
      { station:'Far station', distanceKm:15.4, aqi:120, pollutantCount:6, freshness:{status:'fresh',ageMinutes:20} },
      { station:'Near station', distanceKm:4.4, aqi:null, pollutantCount:2, freshness:{status:'fresh',ageMinutes:35} }
    ] });
    assert.equal(result.station,'Near station');
  });

  it('does not select a station whose freshness is unavailable', () => {
    const result = pickBestStation({ dataType:'live_measurements', stations:[
      { station:'Old station', distanceKm:1, aqi:100, freshness:{status:'unavailable'} }
    ] });
    assert.equal(result,null);
  });

  it('matches CPCB reference breakpoint examples', () => {
    assert.equal(calculateSubIndex('pm25',46.8,'µg/m³')?.subIndex,78);
    assert.equal(calculateSubIndex('pm10',110.6,'µg/m³')?.subIndex,107);
  });
});
