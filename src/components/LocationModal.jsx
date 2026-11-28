import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  X,
  Check,
  AlertCircle,
  Info,
  Search
} from 'lucide-react';
import { classifyAqi } from '../engine';
import {
  fetchAqiNearby,
  fetchApproximateIpLocation,
  searchIndianPlaces,
  pickBestStation,
  stationToCityFormat
} from '../services/aqiApiClient';
// Static list of Indian cities (name, state, lat, lon). Selecting one makes the
// dashboard look up the nearest OpenAQ station using these coordinates.
// If your cities.js lives elsewhere, adjust this path.
import { SORTED_CITIES } from '../cities';

const MAX_VISIBLE = 60;

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

function matchesSearch(candidate, query) {
  const value = String(candidate || '').toLowerCase();
  if (value.includes(query)) return true;
  if (query.length < 4) return false;
  return value.split(/\s+/).some(word => Math.abs(word.length - query.length) <= 1 && editDistance(word, query) <= 1);
}

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Turns an entry of the static city list into the city object the rest of the app uses. */
function staticItemToCity(item) {
  return {
    id: `city-${slug(item.name)}-${slug(item.state)}`,
    name: item.name,
    region: item.state || 'India',
    aqi: null,
    pm25: null,
    primaryPollutant: 'PM2.5',
    lastUpdated: 'Unknown',
    dataSource: 'OpenAQ v3',
    locationSource: 'manual',
    dataType: 'live_measurement',
    isLiveData: true,
    // Coordinates drive the nearest OpenAQ station lookup on the dashboard
    liveQuery: { city: item.name, state: item.state, lat: item.lat, lon: item.lon },
    stationNames: []
  };
}

// Built once at module load (the list never changes at runtime)
const STATIC_ROWS = SORTED_CITIES.map((item) => ({
  key: `${item.name}-${item.state}`,
  item,
  city: staticItemToCity(item),
  demo: false
}));

// ---- Lazy per-city AQI badges ----
// Only the first few visible cities are fetched (3 at a time) so we don't flood
// the backend / OpenAQ rate limits. Results are cached across modal opens.
const AQI_PREFETCH_LIMIT = 6;
const AQI_CONCURRENCY = 2;
const AQI_TTL_MS = 10 * 60 * 1000;      // successful readings
const AQI_FAIL_TTL_MS = 60 * 1000;      // "no station / failed" results
const aqiCache = new Map();             // city.id -> { aqi, pm25, ts }

function getCachedAqi(id) {
  const entry = aqiCache.get(id);
  if (!entry) return null;
  const ttl = entry.aqi != null ? AQI_TTL_MS : AQI_FAIL_TTL_MS;
  return Date.now() - entry.ts < ttl ? entry : null;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentCity,
  onSelectCity
}) {
  const [geoState, setGeoState] = useState({
    status: 'idle', // 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
    message: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [geocodedPlaces, setGeocodedPlaces] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [, setAqiTick] = useState(0); // bumps to re-render when a city's AQI arrives

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extra places (towns not in the static list) found through place search
  useEffect(() => {
    let active = true;
    if (debouncedQuery.length < 2) { setGeocodedPlaces([]); return () => { active = false; }; }
    Promise.resolve(searchIndianPlaces(debouncedQuery))
      .then(places => { if (active) setGeocodedPlaces(Array.isArray(places) ? places : []); })
      .catch(() => { if (active) setGeocodedPlaces([]); });
    return () => { active = false; };
  }, [debouncedQuery]);

  const filteredRows = useMemo(() => {
    const q = debouncedQuery;
    if (!q) return STATIC_ROWS;
    const matchedRows = STATIC_ROWS.filter(({ city }) =>
      matchesSearch(city.name, q) || matchesSearch(city.region, q)
    );
    const known = new Set(matchedRows.map(row => `${row.city.name.toLowerCase()}|${row.city.region.toLowerCase()}`));
    const placeRows = geocodedPlaces
      .map(item => ({
        key: item.id,
        item,
        demo: false,
        city: {
          id: `live-${item.id}`,
          name: item.city,
          region: item.state || 'India',
          aqi: null,
          pm25: null,
          primaryPollutant: 'PM2.5',
          lastUpdated: 'Unknown',
          dataSource: 'OpenAQ v3',
          dataType: 'live_measurement',
          isLiveData: true,
          locationSource: 'manual',
          liveQuery: { city: item.city, state: item.state, lat: item.coordinates?.lat, lon: item.coordinates?.lon },
          stationNames: []
        }
      }))
      .filter(row => !known.has(`${row.city.name.toLowerCase()}|${row.city.region.toLowerCase()}`));
    return [...matchedRows, ...placeRows];
  }, [debouncedQuery, geocodedPlaces]);

  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, MAX_VISIBLE);

  // Stable key so the effect only re-runs when the first visible cities change
  const prefetchKey = visibleRows.slice(0, AQI_PREFETCH_LIMIT).map(r => r.city.id).join('|');

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;

    const targets = visibleRows
      .slice(0, AQI_PREFETCH_LIMIT)
      .map(r => r.city)
      .filter(c => Number.isFinite(c.liveQuery?.lat) && Number.isFinite(c.liveQuery?.lon) && !getCachedAqi(c.id));

    let next = 0;
    const worker = async () => {
      while (active && next < targets.length) {
        const c = targets[next];
        next += 1;
        try {
          const result = await fetchAqiNearby(c.liveQuery.lat, c.liveQuery.lon);
          const best = pickBestStation(result);
          if (best) {
            const mapped = stationToCityFormat(best, c);
            aqiCache.set(c.id, { aqi: mapped?.aqi ?? best.aqi ?? null, pm25: mapped?.pm25 ?? best.pm25 ?? null, ts: Date.now() });
          } else {
            aqiCache.set(c.id, { aqi: null, pm25: null, ts: Date.now() });
          }
        } catch (e) {
          aqiCache.set(c.id, { aqi: null, pm25: null, ts: Date.now() });
        }
        if (active) setAqiTick(t => t + 1);
      }
    };
    for (let i = 0; i < AQI_CONCURRENCY; i += 1) worker();

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefetchKey]);

  if (!isOpen) return null;

  const handleRequestBrowserLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoState({
        status: 'unsupported',
        message: 'Geolocation is not supported by your current browser.'
      });
      return;
    }

    setGeoState({
      status: 'requesting',
      message: 'Requesting browser location permission...'
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeoState({
          status: 'requesting',
          message: `Location received (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°). Scanning for nearby monitoring stations...`
        });

        // Desktop browsers often give an approximate location (Wi-Fi/IP based)
        const accuracyNote = accuracy && accuracy > 3000
          ? ` Your device reported an approximate location (±${(accuracy / 1000).toFixed(1)} km), so the nearest station may differ from the one closest to you.`
          : '';

        // Real live station lookup via backend (nearest CPCB station across India)
        let chosenCity = null;
        try {
          const liveResult = await fetchAqiNearby(latitude, longitude);
          const best = pickBestStation(liveResult);
          if (best) {
            chosenCity = stationToCityFormat(best, {
              id: `geo-${best.stationId || 'station'}`,
              name: best.city || 'Your location',
              region: 'India',
              locationSource: 'auto',
              liveQuery: { lat: latitude, lon: longitude, origin: 'geolocation' }
            });
            const distance = best.distanceKm != null ? `${best.distanceKm} km away` : 'nearby';
            const widened = best.distanceKm > 50
              ? ' This is over 50 km away and is the nearest usable station found within the 100 km search limit.'
              : best.distanceKm > 25
                ? ' No usable station was found within 25 km; this is the nearest found within 100 km.'
                : '';
            setGeoState({
              status: 'granted',
              message: `Connected to live station: ${best.station} (${distance}).${widened}${accuracyNote}`
            });
          }
        } catch (e) {
          // handled below
        }

        if (!chosenCity) {
          // No fake mapping to a "nearest sample city": say plainly that live data was not found
          setGeoState({
            status: 'denied',
            message: 'No recent OpenAQ station was found at your detected coordinates. Your saved city selection is unchanged; search for your city below or retry.'
          });
          return;
        }
        setTimeout(() => {
          onSelectCity(chosenCity);
          onClose();
        }, 1200);
      },
      (error) => {
        let msg = 'Location permission was denied or unavailable. You can pick your city manually below.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was declined. No problem. Search for your city below.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location signal currently unavailable. Please search for your city below.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please search for your city below.';
        }
        setGeoState({ status: 'denied', message: msg });
        if (error.code === error.PERMISSION_DENIED) {
          fetchApproximateIpLocation().then(async approximate => {
            if (!approximate || !Number.isFinite(approximate.lat) || !Number.isFinite(approximate.lon)) return;
            const result = await fetchAqiNearby(approximate.lat, approximate.lon);
            const best = pickBestStation(result);
            if (!best) return;
            const city = stationToCityFormat(best, {
              id: `geo-ip-${best.stationId || 'station'}`,
              name: approximate.city || best.city || 'Approximate area',
              region: approximate.region || 'India',
              locationSource: 'ip-estimated',
              liveQuery: { lat: approximate.lat, lon: approximate.lon, city: approximate.city, origin: 'ip' }
            });
            setGeoState({ status: 'granted', message: `Browser location was denied. Showing an approximate network location near ${approximate.city || 'your area'}; this is not an exact location. Nearest recent OpenAQ CPCB-source station: ${best.station} (${best.distanceKm} km away).` });
            setTimeout(() => { onSelectCity(city); onClose(); }, 1200);
          }).catch(() => {});
        }
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(16, 46, 53, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(16, 46, 53, 0.25)',
          border: '1px solid #C5DDD7'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2ECE9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F3F8F6'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#102E35' }}>
              Choose Your Location
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#6B878D', marginTop: '2px' }}>
              Tailors routine schedules and smog advisories to your area
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2ECE9',
              color: '#3D5A60',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>

          {/* Geolocation Button */}
          <div style={{ marginBottom: '18px' }}>
            <button
              onClick={handleRequestBrowserLocation}
              disabled={geoState.status === 'requesting'}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '0.925rem',
                justifyContent: 'center'
              }}
            >
              <Navigation size={18} color="#8DE0C3" />
              <span>
                {geoState.status === 'requesting'
                  ? 'Requesting Browser Location...'
                  : 'Use My Current Location'}
              </span>
            </button>

            {geoState.status !== 'idle' && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: geoState.status === 'granted' ? '#ECFDF5' : (geoState.status === 'denied' ? '#FFFBEB' : '#F3F8F6'),
                color: geoState.status === 'granted' ? '#065F46' : (geoState.status === 'denied' ? '#92400E' : '#102E35'),
                border: `1px solid ${geoState.status === 'granted' ? '#A7F3D0' : (geoState.status === 'denied' ? '#FDE68A' : '#E2ECE9')}`
              }}>
                {geoState.status === 'granted' ? (
                  <Check size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <span>{geoState.message}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '18px 0',
            color: '#7E989C',
            fontSize: '0.775rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2ECE9' }} />
            <span>Or Search an Indian City</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2ECE9' }} />
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={16} color="#7E989C" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder={`Search ${STATIC_ROWS.length} cities or states...`}
              aria-label="Search cities"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowAll(false); }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '12px',
                border: '1px solid #E2ECE9',
                backgroundColor: '#F3F8F6',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#102E35'
              }}
            />
          </div>

          {/* City Selection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleRows.map(({ key, city: baseCity }, index) => {
              const cached = getCachedAqi(baseCity.id);
              const city = cached ? { ...baseCity, aqi: cached.aqi, pm25: cached.pm25 } : baseCity;
              const hasAqi = city.aqi != null;
              const aqiInfo = classifyAqi(hasAqi ? city.aqi : null);
              const isSelected = currentCity?.id === city.id;
              const isLoadingAqi = !cached && index < AQI_PREFETCH_LIMIT;
              const displayAqi = hasAqi ? city.aqi : (isLoadingAqi ? '…' : '—');
              const pill = 'Live OpenAQ';
              const subtitle = hasAqi
                ? `${city.region} • ${aqiInfo.category}${city.pm25 != null ? ` • PM2.5 ${city.pm25} µg/m³` : ''}`
                : `${city.region} • ${isLoadingAqi ? 'Loading live reading…' : (cached ? 'No recent station nearby' : 'Select to load live OpenAQ data')}`;

              return (
                <div
                  key={key}
                  onClick={() => {
                    onSelectCity(baseCity);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: `1.5px solid ${isSelected ? '#8DE0C3' : '#E2ECE9'}`,
                    backgroundColor: isSelected ? 'rgba(141, 224, 195, 0.12)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: aqiInfo.bgColor,
                      border: `1px solid ${aqiInfo.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: aqiInfo.color
                    }}>
                      {displayAqi}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35' }}>
                        {city.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B878D' }}>
                        {subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
                      fontWeight: 600,
                      border: '1px solid #A7F3D0'
                    }}>
                      {pill}
                    </span>
                    {isSelected && (
                      <Check size={18} color="#102E35" style={{ marginLeft: '4px' }} />
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRows.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#6B878D' }}>
                No city matches "{searchQuery}". Try a nearby larger city, or use your current location.
              </div>
            )}

            {!showAll && filteredRows.length > MAX_VISIBLE && (
              <button
                onClick={() => setShowAll(true)}
                className="btn"
                style={{ alignSelf: 'center', fontSize: '0.8rem', cursor: 'pointer', padding: '8px 14px' }}
              >
                Show all {filteredRows.length} cities
              </button>
            )}
          </div>

          {/* Data notice */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#F3F8F6',
            border: '1px solid #E2ECE9',
            fontSize: '0.775rem',
            color: '#6B878D',
            display: 'flex',
            gap: '8px'
          }}>
            <Info size={16} color="#20464A" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>OpenAQ live data:</strong> Select a city to load the nearest usable OpenAQ station readings. Coverage varies by location; if no recent station is nearby, the dashboard will say so and no sample readings are substituted.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
