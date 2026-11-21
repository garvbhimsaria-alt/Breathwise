import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Wind, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Compass, 
  Moon, 
  SlidersHorizontal, 
  Info, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  Sliders,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/mockData';
import { generateDynamicRoutine } from '../engine';

export default function DailyRoutine({ 
  currentCity, 
  userProfile, 
  engineOutput,
  activeScenarioId,
  onSelectScenario,
  onUpdateProfile 
}) {
  const [simulatedLifestyle, setSimulatedLifestyle] = useState(userProfile.lifestyle || 'working_professional');
  const [simulatedPurifier, setSimulatedPurifier] = useState(userProfile.hasAirPurifier ?? true);
  const [simulatedWakeUp, setSimulatedWakeUp] = useState(userProfile.wakeUpTime || '06:30');
  const [simulatedSleep, setSimulatedSleep] = useState(userProfile.sleepTime || '22:30');

  // Active routine based on effective city AQI and lifestyle inputs
  const dynamicProfile = {
    ...userProfile,
    lifestyle: simulatedLifestyle,
    hasAirPurifier: simulatedPurifier,
    wakeUpTime: simulatedWakeUp,
    sleepTime: simulatedSleep
  };

  // Generate dynamic, explainable routine from core engine
  const effectiveAqiObj = currentCity.aqiResult || { aqi: currentCity.aqi, valid: currentCity.aqi !== null };
  const timelineSteps = generateDynamicRoutine(dynamicProfile, effectiveAqiObj);

  const iconMap = {
    Activity: Activity,
    Compass: Compass,
    Wind: Wind,
    ShieldCheck: ShieldCheck,
    Moon: Moon,
    ShieldAlert: ShieldAlert
  };

  // Determine current active tier label for summary indicator
  const getActiveScenarioSummary = () => {
    const aqiRes = currentCity.aqiResult;
    if (aqiRes && !aqiRes.valid) {
      return {
        label: 'Sensor Data Offline / Missing',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        rule: 'Precautionary default: Exercise indoors • Follow winter baseline smog precautions'
      };
    }
    const aqi = currentCity.aqi ?? 150;
    if (aqi <= 50) {
      return {
        label: 'Good AQI (0–50)',
        color: '#10B981',
        bgColor: '#ECFDF5',
        rule: 'Unrestricted outdoor exercise • Full home & workspace natural cross-ventilation'
      };
    } else if (aqi <= 100) {
      return {
        label: 'Satisfactory AQI (51–100)',
        color: '#84CC16',
        bgColor: '#F7FEE7',
        rule: 'Outdoor activities suitable • Minor caution for sensitive respiratory profiles'
      };
    } else if (aqi <= 200) {
      return {
        label: 'Moderate AQI (101–200)',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        rule: 'Exercise caution along roadside corridors • Controlled midday ventilation window'
      };
    } else if (aqi <= 300) {
      return {
        label: 'Poor AQI (201–300)',
        color: '#F97316',
        bgColor: '#FFF7ED',
        rule: 'Shift strenuous cardio indoors • N95 commute protection • 15-min strict midday flush'
      };
    } else if (aqi <= 400) {
      return {
        label: 'Very Poor AQI (301–400)',
        color: '#EF4444',
        bgColor: '#FEF2F2',
        rule: 'Avoid all outdoor exertion • N95 perimeter seal • Close building envelope'
      };
    } else {
      return {
        label: 'Severe AQI (401–500+)',
        color: '#7F1D1D',
        bgColor: '#FEF2F2',
        rule: 'Emergency Protocol: Zero outdoor exertion • Full building envelope seal • Mechanical HEPA air cleaning'
      };
    }
  };

  const summary = getActiveScenarioSummary();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Signature Feature Banner */}
      <div style={{
        backgroundColor: '#102E35',
        borderRadius: '24px',
        padding: '28px',
        color: '#FFFFFF',
        border: '1px solid #20464A',
        boxShadow: '0 8px 30px rgba(16, 46, 53, 0.12)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(141, 224, 195, 0.2)',
          color: '#8DE0C3',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '10px'
        }}>
          <Sparkles size={14} />
          Signature Feature
        </div>

        <h1 style={{
          fontSize: '1.9rem',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: '8px'
        }}>
          Daily Routine — Your Day, Reimagined
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#C5DDD7',
          maxWidth: '780px',
          lineHeight: 1.6
        }}>
          Urban air pollution shifts dramatically by up to <strong>300%</strong> between cold morning thermal inversions and afternoon sunlight. BreatheWise reorganizes your daily habits around these atmospheric cycles to keep you active while minimizing inhaled micro-pollutants.
        </p>
      </div>

      {/* Interactive Demonstration & Scenario Control Bar */}
      <div className="card" style={{
        padding: '22px 24px',
        borderRadius: '20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #C5DDD7'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="#20464A" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#102E35' }}>
              Interactive Demonstration Controller
            </h3>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700,
              border: '1px solid #A7F3D0'
            }}>
              4 AQI Scenarios
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeScenarioId !== 'current' && (
              <button
                onClick={() => onSelectScenario('current')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.775rem',
                  color: '#20464A',
                  fontWeight: 600,
                  backgroundColor: '#F3F8F6',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2ECE9',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Reset to {currentCity.originalCityName || 'City Default'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scenario Selection Buttons */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select AQI Scenario (Official CPCB Breakpoints + Sensor Fallbacks)
            </label>
            <span style={{ fontSize: '0.7rem', color: '#20464A', fontWeight: 600 }}>
              Synchronized with Dashboard
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px'
          }}>
            {SCENARIO_PRESETS.map((scenario) => {
              const isSelected = activeScenarioId === scenario.id || 
                (activeScenarioId === 'current' && (
                  (scenario.id === 'good' && currentCity.aqi <= 50) ||
                  (scenario.id === 'satisfactory' && currentCity.aqi > 50 && currentCity.aqi <= 100) ||
                  (scenario.id === 'moderate' && currentCity.aqi > 100 && currentCity.aqi <= 200) ||
                  (scenario.id === 'poor' && currentCity.aqi > 200 && currentCity.aqi <= 300) ||
                  (scenario.id === 'very_poor' && currentCity.aqi > 300 && currentCity.aqi <= 400) ||
                  (scenario.id === 'severe' && currentCity.aqi > 400)
                ));

              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onSelectScenario(scenario.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? scenario.color : '#E2ECE9'}`,
                    backgroundColor: isSelected ? `${scenario.color}15` : '#F3F8F6',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? scenario.color : '#102E35' }}>
                      {scenario.label}
                    </span>
                    <span style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: scenario.color,
                      backgroundColor: '#FFFFFF',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      border: `1px solid ${scenario.color}40`
                    }}>
                      {scenario.aqi !== null ? `AQI ${scenario.aqi}` : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B878D', lineHeight: 1.25 }}>
                    {scenario.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Live Guidance Indicator Bar */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: summary.bgColor,
          border: `1.5px solid ${summary.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: summary.color
            }} />
            <strong style={{ fontSize: '0.825rem', color: summary.color }}>
              {summary.label} {currentCity.aqi !== null ? `(AQI ${currentCity.aqi})` : '(Offline)'}:
            </strong>
            <span style={{ fontSize: '0.825rem', color: '#102E35' }}>
              {summary.rule}
            </span>
          </div>

          <span style={{
            fontSize: '0.7rem',
            backgroundColor: 'rgba(16, 46, 53, 0.08)',
            color: '#102E35',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 600
          }}>
            CPCB NAQI Standard
          </span>
        </div>

        {/* Secondary Personalization Toggles: Lifestyle, Purifier, & Schedule */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          borderTop: '1px solid #E2ECE9',
          paddingTop: '14px'
        }}>
          {/* Lifestyle / Occupation Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', marginBottom: '6px', textTransform: 'uppercase' }}>
              Lifestyle & Commute Profile
            </label>
            <select
              value={simulatedLifestyle}
              onChange={(e) => setSimulatedLifestyle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #E2ECE9',
                backgroundColor: '#F3F8F6',
                fontSize: '0.825rem',
                color: '#102E35',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="working_professional">Working Professional (Daily Commute)</option>
              <option value="student">Student (Campus Schedule)</option>
              <option value="wfh">Work From Home (Indoor Control)</option>
              <option value="outdoor_worker">Outdoor / Field Work</option>
            </select>
          </div>

          {/* Wake-up Time Anchor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', marginBottom: '6px', textTransform: 'uppercase' }}>
              Wake-Up Time (Re-anchors Schedule)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['05:30', '06:30', '07:30', '08:30'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSimulatedWakeUp(time)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: `1.5px solid ${simulatedWakeUp === time ? '#8DE0C3' : '#E2ECE9'}`,
                    backgroundColor: simulatedWakeUp === time ? 'rgba(141, 224, 195, 0.2)' : '#F3F8F6',
                    fontSize: '0.75rem',
                    fontWeight: simulatedWakeUp === time ? 700 : 500,
                    color: '#102E35',
                    cursor: 'pointer'
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Home Setup */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', marginBottom: '6px', textTransform: 'uppercase' }}>
              Home Purifier Infrastructure
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: 'Has Air Purifier', val: true },
                { label: 'No Purifier (Affordable Setup)', val: false }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSimulatedPurifier(item.val)}
                  style={{
                    flex: 1,
                    padding: '8px 8px',
                    borderRadius: '10px',
                    border: `1.5px solid ${simulatedPurifier === item.val ? '#8DE0C3' : '#E2ECE9'}`,
                    backgroundColor: simulatedPurifier === item.val ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                    fontSize: '0.75rem',
                    fontWeight: simulatedPurifier === item.val ? 700 : 500,
                    color: '#102E35',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Routine Timeline */}
      <div style={{ position: 'relative' }}>
        
        {/* Vertical Timeline Guide Line */}
        <div style={{
          position: 'absolute',
          top: '30px',
          bottom: '30px',
          left: '27px',
          width: '2px',
          backgroundColor: '#C5DDD7',
          zIndex: 1
        }} className="timeline-connector-line" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
          {timelineSteps.map((step) => {
            const Icon = iconMap[step.icon] || Activity;
            const isAlert = step.badgeType === 'alert';
            const isWarning = step.badgeType === 'warning';
            const isSuccess = step.badgeType === 'success';

            let cardBorder = '#E2ECE9';
            let iconBg = '#EBF8F4';
            let iconColor = '#102E35';
            let badgeBg = '#ECFDF5';
            let badgeColor = '#065F46';
            let badgeBorder = '#A7F3D0';

            if (isAlert) {
              cardBorder = '#FECACA';
              iconBg = '#FEF2F2';
              iconColor = '#7F1D1D';
              badgeBg = '#FEF2F2';
              badgeColor = '#7F1D1D';
              badgeBorder = '#FCA5A5';
            } else if (isWarning) {
              cardBorder = '#FED7AA';
              iconBg = '#FFF7ED';
              iconColor = '#EA580C';
              badgeBg = '#FFF7ED';
              badgeColor = '#C2410C';
              badgeBorder = '#FFEDD5';
            } else if (!isSuccess) {
              // info
              cardBorder = '#C5DDD7';
              iconBg = '#F3F8F6';
              iconColor = '#20464A';
              badgeBg = '#F3F8F6';
              badgeColor = '#20464A';
              badgeBorder = '#E2ECE9';
            }

            return (
              <div 
                key={step.id} 
                className="card card-interactive"
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${cardBorder}`,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Left Timeline Indicator Icon */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  backgroundColor: iconBg,
                  border: `1.5px solid ${badgeBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(16, 46, 53, 0.05)'
                }}>
                  <Icon size={24} color={iconColor} />
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Time & Badges Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#102E35'
                      }}>
                        <Clock size={15} color="#20464A" />
                        {step.time}
                      </span>
                      <span style={{
                        fontSize: '0.725rem',
                        color: '#6B878D',
                        backgroundColor: '#F3F8F6',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 500
                      }}>
                        {step.category}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`
                    }}>
                      {step.badge}
                    </span>
                  </div>

                  {/* Title & Recommendation */}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#102E35', marginBottom: '4px' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '0.925rem', color: '#20464A', fontWeight: 600, lineHeight: 1.45 }}>
                      {step.recommendation}
                    </p>
                  </div>

                  {/* Original Habit Contrast Callout */}
                  <div style={{
                    backgroundColor: '#F3F8F6',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#6B878D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontWeight: 600, color: '#3D5A60' }}>Original Habit:</span>
                    <span>{step.originalHabit}</span>
                    <ArrowRight size={13} color="#7E989C" />
                    <span style={{ fontWeight: 700, color: '#102E35' }}>Adaptive Re-route</span>
                  </div>

                  {/* Reasoning & Expected Benefit Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    {/* Atmospheric Reasoning */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2ECE9',
                      borderRadius: '12px',
                      padding: '12px 14px'
                    }}>
                      <div style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#6B878D',
                        marginBottom: '4px'
                      }}>
                        Why this timing? (Atmospheric Science)
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.45 }}>
                        {step.reasoning}
                      </p>
                    </div>

                    {/* Practical Alternative & Benefit */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2ECE9',
                      borderRadius: '12px',
                      padding: '12px 14px'
                    }}>
                      <div style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isAlert ? '#7F1D1D' : '#065F46',
                        marginBottom: '4px'
                      }}>
                        Practical Alternative & Expected Benefit
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#3D5A60', lineHeight: 1.45 }}>
                        <strong>Action:</strong> {step.practicalAlternative}
                        <br />
                        <span style={{ color: isAlert ? '#7F1D1D' : '#065F46', fontWeight: 600 }}>Benefit:</span> {step.expectedBenefit}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Architecture Callout for Hackathon Judges */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '18px',
        backgroundColor: '#F3F8F6',
        border: '1px solid #C5DDD7',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '0.825rem',
        color: '#3D5A60'
      }}>
        <Sparkles size={20} color="#20464A" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#102E35' }}>Stage 2 Integration Architecture:</strong>
          {' '}This daily routine engine currently implements deterministic heuristic mapping for our sample scenarios. Its clean schema (`time`, `category`, `recommendation`, `reasoning`, `practicalAlternative`, `expectedBenefit`) has been purpose-built to accept live parameter injection from both external AQI sensors and the Gemini 1.5/2.0 API in subsequent stages.
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .timeline-connector-line {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
