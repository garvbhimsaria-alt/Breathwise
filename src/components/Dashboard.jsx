import React from 'react';
import { 
  Wind, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Activity, 
  Calendar, 
  MessageSquare, 
  ChevronRight, 
  Database,
  Thermometer,
  Droplets,
  HelpCircle,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/mockData';

export default function Dashboard({ 
  currentCity, 
  userProfile, 
  engineOutput,
  activeScenarioId,
  onSelectScenario,
  onOpenLocationModal, 
  onNavigateToTab,
  onAskAiQuestion 
}) {
  const aqiResult = engineOutput?.aqiResult || {
    status: 'VALID',
    category: 'Good',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#065F46',
    healthImpact: 'Air quality is satisfactory.'
  };

  const precautionCards = engineOutput?.precautionCards || [];

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isDataMissing = aqiResult.status === 'MISSING' || aqiResult.status === 'INVALID';
  const isDataStale = aqiResult.status === 'STALE';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Greeting & Location Context Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#102E35',
            letterSpacing: '-0.03em',
            lineHeight: 1.2
          }}>
            {getGreeting()}, {userProfile.name || 'Friend'}
          </h1>
          <p style={{ fontSize: '0.925rem', color: '#6B878D', marginTop: '4px' }}>
            CPCB rule-based atmospheric guidance tailored to your daily schedule and profile.
          </p>
        </div>

        {/* Location & Data Provenance Card */}
        <div 
          onClick={onOpenLocationModal}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2ECE9',
            borderRadius: '16px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#F3F8F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#102E35'
          }}>
            <MapPin size={18} color="#20464A" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#102E35' }}>
                {currentCity.name}
              </span>
              <span style={{
                fontSize: '0.675rem',
                backgroundColor: currentCity.isScenarioSimulated ? '#F5F3FF' : '#FFF7ED',
                color: currentCity.isScenarioSimulated ? '#7C3AED' : '#C2410C',
                border: `1px solid ${currentCity.isScenarioSimulated ? '#DDD6FE' : '#FFEDD5'}`,
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: 700
              }}>
                {currentCity.isScenarioSimulated ? `${currentCity.scenarioLabel}` : 'Sample Data'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B878D' }}>
              {currentCity.region || 'Region'} • Click to switch city
            </div>
          </div>
        </div>
      </div>

      {/* Decision Engine CPCB Scenario Switcher */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #C5DDD7',
        borderRadius: '16px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} color="#20464A" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#102E35' }}>
            Decision Engine Testing Controller:
          </span>
          <span style={{ fontSize: '0.725rem', color: '#6B878D' }}>
            (CPCB NAQI Standard Breakpoints)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {SCENARIO_PRESETS.map((s) => {
            const isSelected = activeScenarioId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectScenario(s.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? s.color : '#F3F8F6',
                  color: isSelected ? '#FFFFFF' : '#102E35',
                  border: `1px solid ${isSelected ? s.color : '#E2ECE9'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.label} {s.aqi !== null ? `(${s.aqi})` : ''}
              </button>
            );
          })}

          {activeScenarioId !== 'current' && (
            <button
              onClick={() => onSelectScenario('current')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.725rem',
                color: '#6B878D',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              <RefreshCw size={11} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Hero AQI Status Card */}
      <div 
        className="card"
        style={{
          borderLeft: `6px solid ${aqiResult.color}`,
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 8px 30px rgba(16, 46, 53, 0.06)'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 300px) 1fr',
          gap: '32px',
          alignItems: 'center'
        }} className="aqi-hero-grid">
          
          {/* Left: AQI Number & Category Meter */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '20px',
            borderRadius: '20px',
            backgroundColor: aqiResult.bgColor,
            border: `1.5px solid ${aqiResult.borderColor}`
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: aqiResult.textColor,
              marginBottom: '4px'
            }}>
              CPCB Air Quality Index
            </div>

            <div style={{
              fontSize: isDataMissing ? '2.4rem' : '4.2rem',
              fontWeight: 900,
              lineHeight: 1.1,
              color: aqiResult.color,
              letterSpacing: '-0.04em',
              margin: '8px 0'
            }}>
              {isDataMissing ? 'N/A' : aqiResult.aqi}
            </div>

            <div style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: aqiResult.textColor,
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              border: `1px solid ${aqiResult.borderColor}`,
              marginBottom: '8px'
            }}>
              {aqiResult.category}
            </div>

            <div style={{ fontSize: '0.775rem', color: aqiResult.textColor, fontWeight: 500 }}>
              Primary concern: <strong>{currentCity.primaryPollutant || 'Particulates'}</strong>
            </div>
          </div>

          {/* Right: Explanation & Pollutant Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Outdated / Stale or Missing Data Warning Banner */}
            {isDataStale && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#92400E',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Outdated Sensor Data:</strong> This reading was recorded {aqiResult.lastUpdatedText}. Winter inversion conditions shift rapidly; exercise heightened personal caution.
                </span>
              </div>
            )}

            {isDataMissing && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#F3F8F6',
                border: '1px solid #C5DDD7',
                color: '#102E35',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#20464A" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Sensor Offline:</strong> Reliable air quality telemetry is currently unavailable. BreatheWise does not invent numbers; we recommend default winter morning precautions.
                </span>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#102E35' }}>
                  What this means according to CPCB guidelines:
                </span>
              </div>
              <p style={{
                fontSize: '0.925rem',
                color: '#3D5A60',
                lineHeight: 1.55
              }}>
                {aqiResult.healthImpact}
              </p>
            </div>

            {/* Pollutant Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px'
            }}>
              <div style={{
                backgroundColor: '#F3F8F6',
                border: '1px solid #E2ECE9',
                borderRadius: '12px',
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#6B878D' }}>PM2.5</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35' }}>
                  {currentCity.pm25 !== null ? currentCity.pm25 : '—'} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>µg/m³</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: currentCity.pm25 > 60 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {currentCity.pm25 !== null ? (currentCity.pm25 > 60 ? 'Above Guide' : 'Moderate') : 'Offline'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#F3F8F6',
                border: '1px solid #E2ECE9',
                borderRadius: '12px',
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#6B878D' }}>PM10</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35' }}>
                  {currentCity.pm10 !== null ? currentCity.pm10 : '—'} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>µg/m³</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: currentCity.pm10 > 100 ? '#EA580C' : '#10B981', fontWeight: 600 }}>
                  {currentCity.pm10 !== null ? 'Coarse dust' : 'Offline'}
                </div>
              </div>

              <div style={{
                backgroundColor: '#F3F8F6',
                border: '1px solid #E2ECE9',
                borderRadius: '12px',
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#6B878D' }}>Nitrogen NO2</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35' }}>
                  {currentCity.no2 !== null ? currentCity.no2 : '—'} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>ppb</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: '#6B878D', fontWeight: 500 }}>Traffic emission</div>
              </div>

              <div style={{
                backgroundColor: '#F3F8F6',
                border: '1px solid #E2ECE9',
                borderRadius: '12px',
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#6B878D' }}>Weather</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {currentCity.temp}°C
                </div>
                <div style={{ fontSize: '0.675rem', color: '#6B878D', fontWeight: 500 }}>
                  Humidity: {currentCity.humidity}%
                </div>
              </div>
            </div>

            {/* Data Source & Timestamp Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#6B878D',
              borderTop: '1px solid #E2ECE9',
              paddingTop: '10px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="#7E989C" />
                <span>Source: {currentCity.dataSource || 'Demo Air Quality Network'} • {aqiResult.lastUpdatedText || 'Updated recently'}</span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: currentCity.isScenarioSimulated ? '#7C3AED' : '#C2410C',
                fontWeight: 600
              }}>
                <span>● {currentCity.isScenarioSimulated ? `Simulated ${currentCity.scenarioLabel}` : 'Clearly Labelled Sample Scenario'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explainable Personalized Precaution Cards Grid (Generated by Rule Engine) */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#102E35' }}>
              Engine-Generated Precautions
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#6B878D' }}>
              Logical rules evaluated against {currentCity.name}'s CPCB reading and your profile preferences
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('routine')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <span>View Reimagined Day</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {precautionCards.map((card) => (
            <div key={card.id} className="card" style={{ padding: '20px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase' }}>
                    {card.title}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: card.severity === 'emergency' ? '#FEF2F2' : (card.severity === 'high' ? '#FFF7ED' : '#F3F8F6'),
                    color: card.severity === 'emergency' ? '#7F1D1D' : (card.severity === 'high' ? '#C2410C' : '#102E35'),
                    border: '1px solid #E2ECE9'
                  }}>
                    {card.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35', marginBottom: '8px', lineHeight: 1.4 }}>
                  {card.action}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#3D5A60', lineHeight: 1.45, marginBottom: '10px' }}>
                  <strong>Why?</strong> {card.reason}
                </p>
              </div>

              <div style={{
                backgroundColor: '#F3F8F6',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '0.75rem',
                color: '#6B878D'
              }}>
                <span style={{ fontWeight: 600, color: '#20464A' }}>Alternative: </span>
                <span>{card.alternative}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prominent Shortcut to the AI Assistant */}
      <div 
        style={{
          backgroundColor: '#102E35',
          borderRadius: '24px',
          padding: '28px',
          color: '#FFFFFF',
          border: '1px solid #20464A',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              backgroundColor: 'rgba(141, 224, 195, 0.2)',
              color: '#8DE0C3',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={14} />
              AI Assistant Ready
            </span>
            <span style={{ fontSize: '0.75rem', color: '#7E989C' }}>
              • Rule-Based Air Quality Companion
            </span>
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
            Have questions about today’s smog or your schedule?
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#C5DDD7', maxWidth: '680px', marginBottom: '20px', lineHeight: 1.5 }}>
            BreatheWise AI is designed to personalize recommendations, interpret air quality reports, and guide your daily decisions during severe pollution events.
          </p>

          {/* Quick Clickable Suggested Questions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {[
              'How should I plan my day when AQI is high?',
              'Is it safe to exercise outdoors today?',
              'What precautions should I take during my commute?'
            ].map((question, i) => (
              <button
                key={i}
                onClick={() => onAskAiQuestion(question)}
                style={{
                  backgroundColor: 'rgba(32, 70, 74, 0.8)',
                  color: '#E2ECE9',
                  border: '1px solid rgba(141, 224, 195, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{question}</span>
                <ArrowUpRight size={14} color="#8DE0C3" />
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab('assistant')}
            className="btn btn-accent"
            style={{ padding: '12px 22px', fontSize: '0.925rem' }}
          >
            <MessageSquare size={18} />
            <span>Open BreatheWise AI Chat</span>
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .aqi-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
