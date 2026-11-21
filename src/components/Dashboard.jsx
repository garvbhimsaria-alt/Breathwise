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
  RefreshCw
} from 'lucide-react';
import { getAqiCategory, SCENARIO_PRESETS } from '../data/mockData';

export default function Dashboard({ 
  currentCity, 
  userProfile, 
  activeScenarioId,
  onSelectScenario,
  onOpenLocationModal, 
  onNavigateToTab,
  onAskAiQuestion 
}) {
  const aqiInfo = getAqiCategory(currentCity.aqi);

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
            Here is your urban air-quality summary and routine guidance for today.
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
                {currentCity.isScenarioSimulated ? `${currentCity.scenarioLabel} Scenario` : 'Sample Data'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B878D' }}>
              {currentCity.region || 'Region'} • Click to change city
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Scenario Controller Bar on Dashboard */}
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
            Simulate AQI Scenario:
          </span>
          <span style={{ fontSize: '0.725rem', color: '#6B878D' }}>
            (Synchronized with Daily Routine)
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
                {s.label} ({s.aqi})
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
          borderLeft: `6px solid ${aqiInfo.color}`,
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
            backgroundColor: aqiInfo.bgColor,
            border: `1.5px solid ${aqiInfo.borderColor}`
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: aqiInfo.textColor,
              marginBottom: '4px'
            }}>
              Current Air Quality Index
            </div>

            <div style={{
              fontSize: '4.2rem',
              fontWeight: 900,
              lineHeight: 1,
              color: aqiInfo.color,
              letterSpacing: '-0.04em',
              margin: '8px 0'
            }}>
              {currentCity.aqi}
            </div>

            <div style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: aqiInfo.textColor,
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              border: `1px solid ${aqiInfo.borderColor}`,
              marginBottom: '8px'
            }}>
              {aqiInfo.category}
            </div>

            <div style={{ fontSize: '0.775rem', color: aqiInfo.textColor, fontWeight: 500 }}>
              Primary concern: <strong>{currentCity.primaryPollutant}</strong>
            </div>
          </div>

          {/* Right: Explanation & Pollutant Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#102E35' }}>
                  What this means today:
                </span>
              </div>
              <p style={{
                fontSize: '0.925rem',
                color: '#3D5A60',
                lineHeight: 1.55
              }}>
                {aqiInfo.explanation}
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
                  {currentCity.pm25} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>µg/m³</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: currentCity.pm25 > 60 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {currentCity.pm25 > 60 ? 'Above Guide' : 'Moderate'}
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
                  {currentCity.pm10} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>µg/m³</span>
                </div>
                <div style={{ fontSize: '0.675rem', color: currentCity.pm10 > 100 ? '#EA580C' : '#10B981', fontWeight: 600 }}>
                  Coarse dust
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
                  {currentCity.no2} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>ppb</span>
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
                <span>Source: {currentCity.dataSource || 'Demo Air Quality Network'} • Updated {currentCity.lastUpdated || 'recently'}</span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: currentCity.isScenarioSimulated ? '#7C3AED' : '#C2410C',
                fontWeight: 600
              }}>
                <span>● {currentCity.isScenarioSimulated ? `Simulated ${currentCity.scenarioLabel} Scenario` : 'Clearly Labelled Sample Scenario'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Precaution Cards Grid */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#102E35' }}>
              Personalized Smog Precautions
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#6B878D' }}>
              Calibrated to {currentCity.name}'s current air quality and your profile preferences
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('routine')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <span>View Full Timeline</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Mask Advisory */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: currentCity.aqi > 150 ? '#FEF2F2' : (currentCity.aqi > 100 ? '#FFF7ED' : '#ECFDF5'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={18} color={currentCity.aqi > 150 ? '#EF4444' : (currentCity.aqi > 100 ? '#EA580C' : '#10B981')} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase' }}>
                  Outdoor Masking
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35' }}>
                  {currentCity.aqi > 200 ? 'N95 / FFP2 Mandatory' : (currentCity.aqi > 100 ? 'N95 Strongly Advised' : 'Mask Optional')}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.5 }}>
              {aqiInfo.maskRecommendation}
            </p>
          </div>

          {/* Card 2: Ventilation Advisory */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: currentCity.aqi > 200 ? '#FEF2F2' : (currentCity.aqi > 100 ? '#FFF7ED' : '#EBF8F4'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wind size={18} color={currentCity.aqi > 200 ? '#EF4444' : '#20464A'} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase' }}>
                  Indoor Ventilation
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35' }}>
                  {currentCity.aqi > 200 ? 'Keep Windows Sealed' : (currentCity.aqi > 100 ? 'Restricted Midday Window' : 'Natural Cross-Ventilation')}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.5 }}>
              {aqiInfo.ventilationAdvice}
            </p>
          </div>

          {/* Card 3: Exercise Advisory */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: currentCity.aqi > 100 ? '#FEF2F2' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={18} color={currentCity.aqi > 100 ? '#EF4444' : '#10B981'} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase' }}>
                  Physical Exercise
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35' }}>
                  {currentCity.aqi > 200 ? 'Zero Outdoor Exertion' : (currentCity.aqi > 100 ? 'Shift Indoors' : 'Safe Outdoors')}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.5 }}>
              {aqiInfo.outdoorExercise}
            </p>
          </div>

          {/* Card 4: Health Sensitivity Alert */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={18} color="#8B5CF6" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase' }}>
                  Sensitivity Advisory
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#102E35' }}>
                  {userProfile.healthSensitivity !== 'none' ? 'Profile Notice Active' : 'General Population'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.5 }}>
              {aqiInfo.vulnerableGroupNotice}
            </p>
          </div>
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
              • Generative Gemini Interface Prepared
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
