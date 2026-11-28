import { Router } from 'express';
import { isIP } from 'node:net';
import { fetchNearbyLocations, fetchLocationMeasurements, fetchIndianLocations } from '../services/openaqService.js';
import { calculateAqi, normaliseId, calculateSubIndex } from '../utils/aqiCalculator.js';
import { evaluateFreshness, haversineKm } from '../utils/freshness.js';

const router = Router();
const FRESH_LIMIT_HOURS = 3;
const norm = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const round1 = value => Math.round(value * 10) / 10;

function stationFromDetail(detail, origin) {
  const pollutants = {};
  const units = {};
  const subIndices = {};
  for (const [raw, reading] of Object.entries(detail.pollutants || {})) {
    const key = normaliseId(raw);
    const value = Number(reading?.value);
    if (!Number.isFinite(value) || value < 0) continue;
    pollutants[key] = value;
    units[key] = reading.unit || null;
  }
  const timestamps = Object.values(detail.pollutants || {}).map(p => p?.timestamp).filter(Boolean).sort();
  const latest = timestamps.at(-1) || detail.latestTimestamp;
  const recentPm = ['pm25', 'pm10'].some(key => {
    const timestamp = detail.pollutants?.[key]?.timestamp;
    const ageMs = timestamp ? Date.now() - Date.parse(timestamp) : Infinity;
    return pollutants[key] != null && ageMs >= 0 && ageMs <= FRESH_LIMIT_HOURS * 3600000;
  });
  const aqi = calculateAqi(pollutants, units);
  for (const [key, value] of Object.entries(pollutants)) {
    const sub = calculateSubIndex(key, value, units[key]);
    if (sub) subIndices[key] = sub.subIndex;
  }
  const coords = detail.coordinates;
  const distanceKm = origin && coords ? round1(haversineKm(origin.lat, origin.lon, coords.lat, coords.lon)) : null;
  const category = value => value <= 50 ? 'Good' : value <= 100 ? 'Satisfactory' : value <= 200 ? 'Moderate' : value <= 300 ? 'Poor' : value <= 400 ? 'Very Poor' : 'Severe';
  return {
    station: detail.name, stationId: detail.locationId, city: detail.locality || null, state: detail.state || null,
    coordinates: coords, distanceKm, aqi: aqi?.aqi ?? null,
    aqiLabel: aqi?.aqi != null ? 'Real-time estimate from latest OpenAQ readings' : 'AQI unavailable: insufficient pollutant coverage',
    aqiCategory: aqi?.aqi != null ? category(aqi.aqi) : null,
    dominantPollutant: aqi?.dominantPollutant || null, subIndices, pollutantCount: Object.keys(subIndices).length,
    averagingPeriodNote: 'Real-time estimate from latest observations; this is not a CPCB 24-hour AQI because hourly history coverage is not yet verified.',
    pollutants: Object.fromEntries(['pm25','pm10','no2','so2','co','o3','nh3'].map(k => [k, pollutants[k] ?? null])),
    pollutantUnits: Object.fromEntries(['pm25','pm10','no2','so2','co','o3','nh3'].map(k => [k, units[k] || (k === 'co' ? 'mg/m³' : 'µg/m³')])),
    provider: 'OpenAQ v3', isCpcbSource: true,
    attribution: 'OpenAQ v3; CPCB-source station. Attribution and license are provider-specific.',
    measurementTimestamp: latest || null, freshness: evaluateFreshness(latest),
    dataType: recentPm ? 'live_measurement' : 'stale_measurement', recentPm
  };
}

// Coordinates arrive in two shapes: {lat, lon} (mapped nearby results) and
// {latitude, longitude} (raw inventory rows). Read either.
const coordLat = c => c?.latitude ?? c?.lat;
const coordLon = c => c?.longitude ?? c?.lon;

/**
 * Fetch details for the nearest candidate stations, in small batches, and stop as soon
 * as `want` usable stations are found. This keeps OpenAQ request counts low (the free
 * tier allows ~60 requests/min) instead of fetching dozens of stations every time.
 * Returns { stations, rateLimited }.
 */
async function stationDetails(locations, origin, max = 30, want = 3) {
  const unique = [...new Map((locations || []).filter(x => x?.id != null).map(x => [String(x.id), x])).values()];
  const distanceOf = loc => origin && loc.coordinates
    ? haversineKm(origin.lat, origin.lon, coordLat(loc.coordinates), coordLon(loc.coordinates))
    : Infinity;
  const sorted = origin
    ? unique.map(loc => ({ loc, d: distanceOf(loc) })).sort((a, b) => a.d - b.d).map(x => x.loc)
    : unique;

  const candidates = sorted.slice(0, max);
  const found = [];
  let rateLimited = false;
  const BATCH_SIZE = 3;

  for (let i = 0; i < candidates.length && found.length < want && !rateLimited; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async loc => {
      const detail = await fetchLocationMeasurements(loc.id);
      if (detail.status === 429) { rateLimited = true; return null; }
      if (detail.error || !detail.isCpcb) return null;
      detail.locality = loc.locality || null;
      detail.state = loc.state || null;
      const station = stationFromDetail(detail, origin);
      return station.recentPm ? station : null;
    }));
    found.push(...results.filter(Boolean));
  }

  found.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return { stations: found, rateLimited };
}

let citiesCache = { expires: 0, value: null };
router.get('/cities', async (_req,res) => {
  try {
    const inventory = await fetchIndianLocations();
    if (inventory.error) return res.status(502).json({ dataType:'unavailable', provider:'OpenAQ v3', error:inventory.error });
    if (citiesCache.expires > Date.now()) return res.json({ ...citiesCache.value, fromCache:true });
    const groups = new Map();
    for (const loc of inventory.locations || []) {
      if (!loc.isCpcb || loc.country !== 'IN') continue;
      const city = String(loc.locality || '').trim();
      if (!city || ['india','unknown','n/a'].includes(norm(city))) continue;
      const state = loc.state || null;
      const key = `${norm(city)}|${norm(state)}`;
      if (!groups.has(key)) groups.set(key,{city, state, locations:[], coordinates:[]});
      const g=groups.get(key); g.locations.push(loc);
      if (loc.coordinates) g.coordinates.push(loc.coordinates);
    }
    const cities=[...groups.values()].map(g=>({
      id:`openaq-${norm(g.city).replace(/\s+/g,'-')}`, city:g.city, state:g.state, aqi:null, category:null,
      dominantPollutant:null, pm25:null, stationCount:g.locations.length, lastUpdated:null,
      coordinates:g.coordinates.length ? {lat:g.coordinates.reduce((s,c)=>s+c.latitude,0)/g.coordinates.length,lon:g.coordinates.reduce((s,c)=>s+c.longitude,0)/g.coordinates.length} : null,
      stationNames:g.locations.map(loc=>loc.name).filter(Boolean)
    }));
    const popular=['Delhi','New Delhi','Noida','Ghaziabad','Gurugram','Faridabad','Mumbai','Pune','Bengaluru','Chennai','Kolkata','Hyderabad','Lucknow','Patna','Ahmedabad'];
    cities.sort((a,b)=>{
      const ai=popular.findIndex(x=>norm(x)===norm(a.city)); const bi=popular.findIndex(x=>norm(x)===norm(b.city));
      return (ai<0?999:ai)-(bi<0?999:bi) || a.city.localeCompare(b.city);
    });
    const payload={dataType:'live_station_catalog',provider:'OpenAQ v3 (CPCB-source stations only)',cities,total:cities.length,locationsTotal:inventory.total,partial:inventory.partial||false,fetchedAt:inventory.fetchedAt};
    citiesCache={expires:Date.now()+30*60*1000,value:payload};
    res.json(payload);
  } catch (error) {
    console.error('[OpenAQ city list]',error?.message||error);
    res.status(502).json({dataType:'unavailable',provider:'OpenAQ v3',error:'OpenAQ city list unavailable.'});
  }
});

router.get('/city', async (req,res) => {
  const city=String(req.query.city||'').trim();
  if(!city) return res.status(400).json({error:'city query parameter is required.'});
  let lat=Number(req.query.lat), lon=Number(req.query.lon);
  const inventory=await fetchIndianLocations();
  if((!Number.isFinite(lat)||!Number.isFinite(lon)) && !inventory.error){
    const match=(inventory.locations||[]).find(loc=>loc.isCpcb && norm(loc.locality)===norm(city) && loc.coordinates);
    lat=match?.coordinates?.latitude; lon=match?.coordinates?.longitude;
  }
  if(!Number.isFinite(lat)||!Number.isFinite(lon)) return res.status(404).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,message:`No OpenAQ CPCB-source locations found for ${city}.`});
  const origin={lat,lon};
  const nearby=await fetchNearbyLocations(lat,lon,{radiusM:25000,limit:100});
  if(nearby.error) return res.status(502).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,error:nearby.error});
  let locations=nearby.locations||[];
  if(!inventory.error){
    locations=[...locations,...(inventory.locations||[]).filter(loc=>loc.isCpcb&&loc.coordinates&&haversineKm(lat,lon,loc.coordinates.latitude,loc.coordinates.longitude)<=100)];
  }
  const { stations, rateLimited } = await stationDetails(locations,origin,12);
  if(!stations.length) {
    if(rateLimited) return res.status(429).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,error:'OpenAQ rate limit reached. Wait a minute and retry.'});
    return res.status(404).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,message:`No recent OpenAQ CPCB-source PM2.5/PM10 reading found for ${city}.`});
  }
  res.json({dataType:'live_measurements',provider:'OpenAQ v3',primaryProvider:'OpenAQ v3',stations,stationCount:stations.length,searchCoordinates:origin,fetchedAt:nearby.fetchedAt,fromCache:!!nearby.fromCache,fallbackUsed:false});
});

// Short-lived cache of successful /nearby answers (same coordinates are requested by the
// city picker badges and then by the dashboard, so the second call is instant).
const nearbyCache = new Map();
const NEARBY_CACHE_TTL_MS = 5 * 60 * 1000;

router.get('/nearby', async (req,res) => {
  const lat=Number(req.query.lat), lon=Number(req.query.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return res.status(400).json({error:'lat and lon query parameters are required and must be valid coordinates.'});
  const origin={lat,lon};
  const radiusKm=Math.min(100,Math.max(1,Number(req.query.radiusKm)||100));
  const cacheKey=`${lat.toFixed(3)}|${lon.toFixed(3)}|${radiusKm}`;
  const cachedNearby=nearbyCache.get(cacheKey);
  if(cachedNearby && Date.now()-cachedNearby.at<NEARBY_CACHE_TTL_MS) return res.json({...cachedNearby.payload,fromCache:true});
  const nearby=await fetchNearbyLocations(lat,lon,{radiusM:25000,limit:100});
  if(nearby.error) return res.status(502).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,error:nearby.error});
  let locations=nearby.locations||[];
  // OpenAQ's radius parameter is capped at 25 km. Use the cached all-India
  // station inventory to expand the candidate search without inventing data.
  if(radiusKm>25){
    const inventory=await fetchIndianLocations();
    if(!inventory.error){
      const candidates=(inventory.locations||[]).filter(loc=>loc.isCpcb&&loc.coordinates&&haversineKm(lat,lon,loc.coordinates.latitude,loc.coordinates.longitude)<=radiusKm);
      locations=[...locations,...candidates];
    }
  }
  const { stations: all, rateLimited } = await stationDetails(locations,origin,50,3);
  const stations=all.filter(st=>st.distanceKm<=radiusKm).slice(0,10);
  if(!stations.length) {
    if(rateLimited) return res.status(429).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,searchCoordinates:origin,radiusKm,error:'OpenAQ rate limit reached. Wait a minute and retry.'});
    return res.status(404).json({dataType:'unavailable',provider:'OpenAQ v3',stations:[],stationCount:0,searchCoordinates:origin,radiusKm,error:`No recent OpenAQ CPCB-source PM2.5 or PM10 station found within ${radiusKm} km.`});
  }
  const payload={dataType:'live_measurements',provider:'OpenAQ v3',primaryProvider:'OpenAQ v3',stations,stationCount:stations.length,searchCoordinates:origin,radiusKm,inferredCity:null,fetchedAt:new Date().toISOString(),fromCache:!!nearby.fromCache,fallbackUsed:false};
  nearbyCache.set(cacheKey,{at:Date.now(),payload});
  res.json(payload);
});

router.get('/station/:locationId', async (req,res) => {
  const id=Number.parseInt(req.params.locationId,10);
  if(!Number.isFinite(id)) return res.status(400).json({error:'locationId must be a number.'});
  const detail=await fetchLocationMeasurements(id);
  if(detail.error) return res.status(502).json({error:detail.error,provider:'OpenAQ v3'});
  if(!detail.isCpcb) return res.status(404).json({error:'This location is not marked as CPCB-source data on OpenAQ.',provider:'OpenAQ v3'});
  res.json({dataType:'live_measurements',provider:'OpenAQ v3',station:stationFromDetail(detail),fetchedAt:detail.fetchedAt});
});

router.get('/providers', (_req,res) => res.json({
  aqi:{name:'OpenAQ v3, CPCB-source locations only',role:'primary and only AQI source',keyConfigured:Boolean(process.env.OPENAQ_API_KEY),endpoint:'https://api.openaq.org/v3'},
  weather:{name:'Open-Meteo',role:'weather only',keyRequired:false}
}));

router.get('/geocode', async (req,res) => {
  const name=String(req.query.name||'').trim();
  if(name.length<2) return res.json({results:[]});
  const url=new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search=new URLSearchParams({name,count:'20',language:'en',format:'json',countryCode:'IN'}).toString();
  try {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),7000);
    let response;
    try { response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}}); }
    finally { clearTimeout(timer); }
    if(!response.ok) return res.status(502).json({error:`Open-Meteo geocoding returned HTTP ${response.status}`});
    const json=await response.json();
    res.json({provider:'Open-Meteo Geocoding',results:(json.results||[]).map(place=>({id:`geo-${place.id}`,city:place.name,state:place.admin1||null,country:place.country||'India',coordinates:{lat:place.latitude,lon:place.longitude},stationCount:0,stationNames:[]}))});
  } catch(error) { res.status(502).json({error:error.name==='AbortError'?'Place search timed out':'Place search unavailable'}); }
});

const weatherCache = new Map();
router.get('/weather', async (req,res) => {
  const lat=Number(req.query.lat), lon=Number(req.query.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return res.status(400).json({error:'Valid lat and lon are required.'});
  const key=`${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached=weatherCache.get(key);
  if(cached&&Date.now()-cached.at<10*60*1000) return res.json({...cached.data,fromCache:true});
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',hourly:'boundary_layer_height,visibility',forecast_days:'1',timezone:'Asia/Kolkata'}).toString();
  try {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
    let response;
    try { response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}}); }
    finally { clearTimeout(timer); }
    if(!response.ok) return res.status(502).json({error:`Open-Meteo returned HTTP ${response.status}`});
    const json=await response.json();
    const now=json.current?.time;
    const hourIndex=Array.isArray(json.hourly?.time)?json.hourly.time.indexOf(now):-1;
    const data={provider:'Open-Meteo',temperature:json.current?.temperature_2m??null,humidity:json.current?.relative_humidity_2m??null,windSpeed:json.current?.wind_speed_10m??null,windDirection:json.current?.wind_direction_10m??null,boundaryLayerHeight:hourIndex>=0?(json.hourly.boundary_layer_height?.[hourIndex]??null):null,visibility:hourIndex>=0?(json.hourly.visibility?.[hourIndex]??null):null,observedAt:now||null};
    weatherCache.set(key,{at:Date.now(),data});
    res.json(data);
  } catch(error) { res.status(502).json({error:error.name==='AbortError'?'Open-Meteo weather request timed out':'Weather service unavailable'}); }
});

router.get('/ip-location', async (req,res) => {
  try {
    const forwarded=String(req.headers['cf-connecting-ip']||req.headers['x-forwarded-for']||'').split(',')[0].trim();
    const clientIp=forwarded||req.socket.remoteAddress||'';
    if(!isIP(clientIp)||clientIp==='127.0.0.1'||clientIp==='::1') return res.status(404).json({error:'Approximate location is unavailable for this network.'});
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),5000);
    let response;
    try { response=await fetch(`https://ipapi.co/${encodeURIComponent(clientIp)}/json/`,{signal:controller.signal,headers:{Accept:'application/json'}}); }
    finally { clearTimeout(timer); }
    if(!response.ok) return res.status(502).json({error:'Approximate IP location is unavailable.'});
    const data=await response.json();
    const lat=Number(data.latitude),lon=Number(data.longitude);
    if(data.country_code!=='IN'||!Number.isFinite(lat)||!Number.isFinite(lon)) return res.status(404).json({error:'Approximate location is outside India or unavailable.'});
    res.json({lat,lon,city:data.city||null,region:data.region||null,accuracy:'approximate',provider:'ipapi.co'});
  } catch(error) { res.status(502).json({error:error.name==='AbortError'?'Approximate location request timed out':'Approximate location unavailable.'}); }
});

export default router;
