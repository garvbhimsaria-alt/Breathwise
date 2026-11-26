import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  X,
  Check,
  AlertCircle,
  Info,
  Search,
  RefreshCw
} from 'lucide-react';
import { SAMPLE_CITIES } from '../data/mockData';
import { classifyAqi } from '../engine';
import {
  fetchAqiNearby,
  fetchCityList,
  pickBestStation,
  stationToCityFormat
} from '../services/aqiApiClient';

const MAX_VISIBLE = 60;
// Only used when the backend cannot supply the live city list.
const DEMO_FALLBACK_IDS = ['delhi', 'mumbai', 'bengaluru'];

const formatPollutant = (id) => {
  if (!id) return null;
  const v = String(id).toLowerCase();
  if (v === 'pm25') return 'PM2.5';
  if (v === 'pm10') return 'PM10';
  return v.toUpperCase();
};

/** Turns a row of the live city list into the city object the rest of the app uses. */
function liveItemToCity(item) {
  return {
    id: `live-${item.id}`,
    name: item.city,
    region: item.state || 'India',
    aqi: item.aqi,
    pm25: item.pm25,
    primaryPollutant: formatPollutant(item.dominantPollutant) || 'PM2.5',
    lastUpdated: item.lastUpdated || 'Unknown',
    dataSource: 'CPCB via data.gov.in',
    dataType: 'live_measurement',
    isLiveData: true,
    // Exact CPCB names, so the dashboard fetch hits the right city
    liveQuery: { city: item.city, state: item.state }
  };
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
  const [showAll, setShowAll] = useState(false);
  const [cityList, setCityList] = useState({ status: 'idle', cities: [], error: null, fetchedAt: null });

  const loadCities = async () => {
    setCityList((prev) => ({ ...prev, status: 'loading', error: null }));
    const result = await fetchCityList();
    if (result.error || !result.cities || result.cities.length === 0) {
      setCityList({ status: 'error', cities: [], error: result.error || 'No cities returned', fetchedAt: null });
    } else {
      setCityList({ status: 'ready', cities: result.cities, error: null, fetchedAt: result.fetchedAt || null });
    }
  };

  // Load the live city list whenever the picker opens (cached by the client for 10 min)
  useEffect(() => {
    if (isOpen && cityList.status !== 'ready' && cityList.status !== 'loading') {
      loadCities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const rows = useMemo(() => {
    if (cityList.status === 'ready') {
      return cityList.cities.map((item) => ({ key: item.id, item, city: liveItemToCity(item), demo: false }));
    }
    if (cityList.status === 'error') {
      return SAMPLE_CITIES.filter((c) => DEMO_FALLBACK_IDS.includes(c.id)).map((c) => ({
        key: c.id,
        item: null,
        city: c,
        demo: true
      }));
    }
    return [];
  }, [cityList]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ city }) =>
      city.name.toLowerCase().includes(q) || String(city.region || '').toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const visibleRows = showAll ? filteredRows : filteredRows.slice(0, MAX_VISIBLE);

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
              name: best.city || best.station,
              region: `Station ${best.distanceKm != null ? `${best.distanceKm} km away` : 'Nearby'}`
            });
            const distance = best.distanceKm != null ? `${best.distanceKm} km away` : 'nearby';
            const widened = liveResult.widenedSearch
              ? ' No station was found within 50 km, so this is the nearest one available.'
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
            message: 'I could not find a live monitoring station for your location right now. Please search for your city below.'
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
        setGeoState({
          status: 'denied',
          message: msg
        });
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
              placeholder={cityList.status === 'ready' ? `Search ${cityList.cities.length} cities or states...` : 'Search cities...'}
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

          {/* Loading / error states */}
          {cityList.status === 'loading' && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#6B878D' }}>
              Loading live cities from CPCB… this can take up to a minute if the server is waking up.
            </div>
          )}

          {cityList.status === 'error' && (
            <div style={{
              marginBottom: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              backgroundColor: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <span>Could not load the live city list ({cityList.error}). Showing a few demo cities instead.</span>
              <button
                onClick={loadCities}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* City Selection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleRows.map(({ key, item, city, demo }) => {
              const hasAqi = city.aqi != null;
              const aqiInfo = classifyAqi(hasAqi ? city.aqi : null);
              const isSelected = currentCity?.id === city.id;
              const displayAqi = hasAqi ? city.aqi : 'N/A';

              let pill;
              if (demo) {
                pill = 'Demo data';
              } else if (!hasAqi) {
                pill = 'Limited data';
              } else if (city.pm25 != null) {
                pill = `PM2.5: ${city.pm25} µg/m³`;
              } else {
                pill = `${item.stationCount} station${item.stationCount === 1 ? '' : 's'}`;
              }

              const subtitle = demo
                ? `${city.region} • ${aqiInfo.category}`
                : `${city.region} • ${hasAqi ? aqiInfo.category : 'No AQI (not enough pollutant data)'}`;

              return (
                <div
                  key={key}
                  onClick={() => {
                    onSelectCity(city);
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
                      backgroundColor: aqiInfo.bgColor,
                      color: aqiInfo.textColor,
                      fontWeight: 600,
                      border: `1px solid ${aqiInfo.borderColor}`
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

            {cityList.status !== 'loading' && filteredRows.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#6B878D' }}>
                No monitored city matches "{searchQuery}". Only cities with a CPCB monitoring station are listed. Try a nearby larger city, or use your current location.
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
              {cityList.status === 'ready' ? (
                <>
                  <strong>Live data:</strong> CPCB monitoring stations via data.gov.in. A city's AQI here is the average of its stations' real-time readings, so it can differ from the official 24-hour CPCB figure. Only cities with a monitoring station are listed.
                </>
              ) : (
                <>
                  <strong>Demo data:</strong> the live city list is not available, so the values shown are sample data and not real measurements.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
