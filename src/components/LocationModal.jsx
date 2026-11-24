import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  X, 
  Check, 
  AlertCircle, 
  Info,
  Search,
  Sparkles,
  Radio
} from 'lucide-react';
import { SAMPLE_CITIES } from '../data/mockData';
import { classifyAqi } from '../engine';
import { fetchAqiNearby, pickBestStation, stationToCityFormat } from '../services/aqiApiClient';

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
        // Location permitted!
        const { latitude, longitude } = position.coords;
        setGeoState({
          status: 'requesting',
          message: `Location received (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°). Scanning for nearby monitoring stations...`
        });

        // 1. Try real live station lookup via backend proxy
        let chosenCity = null;
        try {
          const liveResult = await fetchAqiNearby(latitude, longitude);
          const best = pickBestStation(liveResult);
          if (best) {
            chosenCity = stationToCityFormat(best, {
              id: `geo-${best.stationId || 'station'}`,
              name: best.city || best.station,
              region: `Station ${best.distanceKm ? `${best.distanceKm} km away` : 'Nearby'}`
            });
            setGeoState({
              status: 'granted',
              message: `Connected to live station: ${best.station} (${best.distanceKm ? `${best.distanceKm} km away` : 'nearby'}).`
            });
          }
        } catch (e) {
          // Live lookup error; proceed to demo fallback
        }

        // 2. Fallback to nearest demo city if backend unavailable or no stations found
        if (!chosenCity) {
          let bestMatch = SAMPLE_CITIES[0]; // default Delhi
          if (latitude < 16) {
            bestMatch = SAMPLE_CITIES.find(c => c.id === 'bengaluru') || SAMPLE_CITIES[0];
          } else if (latitude < 24) {
            bestMatch = SAMPLE_CITIES.find(c => c.id === 'mumbai') || SAMPLE_CITIES[0];
          } else if (latitude > 45) {
            bestMatch = SAMPLE_CITIES.find(c => c.id === 'london') || SAMPLE_CITIES[0];
          } else if (latitude > 35 && longitude < -70) {
            bestMatch = SAMPLE_CITIES.find(c => c.id === 'newyork') || SAMPLE_CITIES[0];
          }
          chosenCity = bestMatch;
          setGeoState({
            status: 'granted',
            message: `Location received (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°). Mapped to nearest sample observatory: ${bestMatch.name}.`
          });
        }

        setTimeout(() => {
          onSelectCity(chosenCity);
          onClose();
        }, 1200);
      },
      (error) => {
        let msg = 'Location permission was denied or unavailable. You can easily pick any location manually below!';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access permission was declined. No problem! Simply choose your city manually from the list below.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location signal currently unavailable. Please pick a location manually below.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please choose manually.';
        }
        setGeoState({
          status: 'denied',
          message: msg
        });
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const filteredCities = SAMPLE_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

            {/* Geolocation Feedback Message */}
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
            <span>Or Select a Sample City</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2ECE9' }} />
          </div>

          {/* Search Input */}
          <div style={{
            position: 'relative',
            marginBottom: '14px'
          }}>
            <Search size={16} color="#7E989C" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search cities..."
              aria-label="Search cities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredCities.map((city) => {
              const aqiInfo = classifyAqi(city.aqi);
              const isSelected = currentCity?.id === city.id;
              const displayAqi = city.aqi != null ? city.aqi : 'N/A';
              const displayPm25 = city.pm25 != null ? `${city.pm25} µg/m³` : 'Data Offline';

              return (
                <div
                  key={city.id}
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
                        {city.region} • {aqiInfo.category}
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
                      {city.primaryPollutant}: {displayPm25}
                    </span>
                    {isSelected && (
                      <Check size={18} color="#102E35" style={{ marginLeft: '4px' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prototype Disclosure Callout */}
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
              <strong>Sample Data Notice:</strong> All cities use curated sample scenarios reflecting real-world smog patterns, powered by our deterministic CPCB Decision Engine with clearly labeled demonstration data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
