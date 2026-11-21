import React, { useState } from 'react';
import { 
  Wind, 
  User, 
  MapPin, 
  Briefcase, 
  Navigation, 
  Activity, 
  Check, 
  ArrowRight, 
  X,
  Shield,
  Sparkles
} from 'lucide-react';
import { SAMPLE_CITIES } from '../data/mockData';

export default function OnboardingModal({ 
  isOpen, 
  onClose, 
  userProfile, 
  onSaveProfile 
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ ...userProfile });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSaveProfile({ ...formData, hasCompletedOnboarding: true });
      onClose();
    }
  };

  const handleSkip = () => {
    onSaveProfile({ ...formData, hasCompletedOnboarding: true });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(16, 46, 53, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(16, 46, 53, 0.35)',
          border: '1px solid #C5DDD7',
          padding: '28px',
          position: 'relative'
        }}
      >
        {/* Top Header with Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#102E35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wind size={18} color="#8DE0C3" />
            </div>
            <span style={{ fontWeight: 800, color: '#102E35', fontSize: '1rem' }}>BreatheWise</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B878D' }}>
              Step {step} of 3
            </span>
            <button
              onClick={handleSkip}
              style={{
                fontSize: '0.775rem',
                color: '#6B878D',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Step 1: Name & Location */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#102E35', marginBottom: '6px' }}>
              Welcome to BreatheWise
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B878D', marginBottom: '20px' }}>
              Let’s personalize your daily smog defense routine and air-quality schedule.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  What should we call you?
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#7E989C" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '12px',
                      border: '1px solid #E2ECE9',
                      backgroundColor: '#F3F8F6',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#102E35'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  Primary City (Sample Scenario)
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#7E989C" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <select
                    value={formData.cityId}
                    onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '12px',
                      border: '1px solid #E2ECE9',
                      backgroundColor: '#F3F8F6',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: '#102E35',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {SAMPLE_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region}) — AQI {c.aqi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Lifestyle, Commute & Exercise */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#102E35', marginBottom: '6px' }}>
              Your Daily Movement
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B878D', marginBottom: '18px' }}>
              BreatheWise adapts workout and commute timing around ambient smog peaks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  Occupation / Lifestyle
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'working_professional', label: 'Working Professional' },
                    { id: 'student', label: 'Student' },
                    { id: 'wfh', label: 'Work From Home' },
                    { id: 'outdoor_worker', label: 'Outdoor / Field' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, lifestyle: item.id })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${formData.lifestyle === item.id ? '#8DE0C3' : '#E2ECE9'}`,
                        backgroundColor: formData.lifestyle === item.id ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                        fontSize: '0.825rem',
                        fontWeight: formData.lifestyle === item.id ? 700 : 500,
                        color: '#102E35',
                        textAlign: 'left'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  Typical Exercise Routine
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'morning_runner', label: 'Morning Runner / Outdoor' },
                    { id: 'evening_runner', label: 'Evening Runner / Walk' },
                    { id: 'gym_indoor', label: 'Indoor Gym / Studio' },
                    { id: 'none', label: 'Light / Casual Movement' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, exerciseHabit: item.id })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${formData.exerciseHabit === item.id ? '#8DE0C3' : '#E2ECE9'}`,
                        backgroundColor: formData.exerciseHabit === item.id ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                        fontSize: '0.825rem',
                        fontWeight: formData.exerciseHabit === item.id ? 700 : 500,
                        color: '#102E35',
                        textAlign: 'left'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Home Setup & Sensitivities */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#102E35', marginBottom: '6px' }}>
              Home Air Setup
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B878D', marginBottom: '18px' }}>
              Enables practical, affordable ventilation and indoor air advice.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  Do you currently have a HEPA Air Purifier at home?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { val: true, label: 'Yes, in use' },
                    { val: false, label: 'No, not yet' },
                    { val: 'unsure', label: 'Not sure / AC only' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, hasAirPurifier: item.val })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${formData.hasAirPurifier === item.val ? '#8DE0C3' : '#E2ECE9'}`,
                        backgroundColor: formData.hasAirPurifier === item.val ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                        fontSize: '0.825rem',
                        fontWeight: formData.hasAirPurifier === item.val ? 700 : 500,
                        color: '#102E35'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#102E35', marginBottom: '6px' }}>
                  Respiratory Sensitivity
                </label>
                <select
                  value={formData.healthSensitivity}
                  onChange={(e) => setFormData({ ...formData, healthSensitivity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #E2ECE9',
                    backgroundColor: '#F3F8F6',
                    fontSize: '0.875rem',
                    color: '#102E35'
                  }}
                >
                  <option value="none">Standard / No known sensitivity</option>
                  <option value="mild_asthma">Asthma or reactive airways</option>
                  <option value="sensitive_throat">Dust allergy / throat sensitivity</option>
                  <option value="senior_household">Senior or infant at home</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid #E2ECE9'
        }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '10px 20px' }}
          >
            <span>{step === 3 ? 'Launch BreatheWise' : 'Next Step'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
