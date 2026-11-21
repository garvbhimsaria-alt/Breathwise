import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Activity, 
  ShieldCheck, 
  X, 
  Check, 
  Car, 
  Wind,
  Save
} from 'lucide-react';
import { SAMPLE_CITIES } from '../data/mockData';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  userProfile, 
  onSaveProfile 
}) {
  const [formData, setFormData] = useState({ ...userProfile });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(16, 46, 53, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 105,
      padding: '16px'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 45px rgba(16, 46, 53, 0.25)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#102E35' }}>
              Profile & Routine Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B878D' }}>
              Personalize your schedule, commute factors, and sensitivity alerts
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Preferred Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Preferred Name / Greeting
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #E2ECE9',
                backgroundColor: '#F3F8F6',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#102E35'
              }}
              required
            />
          </div>

          {/* Lifestyle / Occupation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Occupation & Lifestyle
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'working_professional', label: 'Working Professional' },
                { id: 'student', label: 'Student' },
                { id: 'wfh', label: 'Work From Home' },
                { id: 'outdoor_worker', label: 'Outdoor / Field Worker' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
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

          {/* Commute Mode & Distance */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Primary Commute Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[
                { id: 'metro', label: 'Metro / Train' },
                { id: 'bus', label: 'Bus' },
                { id: 'car', label: 'Car / Cab' },
                { id: 'bike', label: 'Motorbike / Scooter' },
                { id: 'walking', label: 'Walk / Bicycle' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setFormData({ ...formData, commuteType: item.id })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: `1.5px solid ${formData.commuteType === item.id ? '#8DE0C3' : '#E2ECE9'}`,
                    backgroundColor: formData.commuteType === item.id ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                    fontSize: '0.8rem',
                    fontWeight: formData.commuteType === item.id ? 700 : 500,
                    color: '#102E35'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.825rem', color: '#6B878D' }}>Typical one-way distance:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.commuteDistanceKm || 10}
                onChange={(e) => setFormData({ ...formData, commuteDistanceKm: Number(e.target.value) })}
                style={{
                  width: '70px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2ECE9',
                  backgroundColor: '#F3F8F6',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              />
              <span style={{ fontSize: '0.825rem', color: '#6B878D' }}>km</span>
            </div>
          </div>

          {/* Exercise Habits */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Exercise Habits & Outdoor Timing
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'morning_runner', label: 'Early Morning Outdoor Run' },
                { id: 'evening_runner', label: 'Evening Walk / Run' },
                { id: 'gym_indoor', label: 'Indoor Gym Workout' },
                { id: 'none', label: 'No Regular Workout' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
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

          {/* Home Facilities */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Home Air Infrastructure
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { val: true, label: 'HEPA Air Purifier' },
                { val: false, label: 'No Purifier' },
                { val: 'unsure', label: 'AC Only / Unsure' }
              ].map((item, idx) => (
                <button
                  type="button"
                  key={idx}
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

          {/* Daily Schedule Anchors (Wake-up & Bedtime) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Daily Schedule (Anchors Your Routine Timeline)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B878D', marginBottom: '4px' }}>
                  Target Wake-Up Time
                </span>
                <input
                  type="time"
                  value={formData.wakeUpTime || '06:30'}
                  onChange={(e) => setFormData({ ...formData, wakeUpTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2ECE9',
                    backgroundColor: '#F3F8F6',
                    fontSize: '0.85rem',
                    color: '#102E35',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B878D', marginBottom: '4px' }}>
                  Target Sleep Time
                </span>
                <input
                  type="time"
                  value={formData.sleepTime || '22:30'}
                  onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2ECE9',
                    backgroundColor: '#F3F8F6',
                    fontSize: '0.85rem',
                    color: '#102E35',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Health Sensitivity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#102E35', marginBottom: '6px' }}>
              Respiratory Health Sensitivity
            </label>
            <select
              value={formData.healthSensitivity}
              onChange={(e) => setFormData({ ...formData, healthSensitivity: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #E2ECE9',
                backgroundColor: '#F3F8F6',
                fontSize: '0.875rem',
                color: '#102E35'
              }}
            >
              <option value="none">Standard — No heightened sensitivity</option>
              <option value="mild_asthma">Mild / Moderate Asthma</option>
              <option value="sensitive_throat">Allergic Rhinitis / Dust Allergy</option>
              <option value="senior_household">Senior Citizen or Infant at Home</option>
            </select>
          </div>

          {/* Save Button & Feedback */}
          <div style={{ paddingTop: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '14px',
                fontSize: '0.95rem'
              }}
            >
              {savedNotice ? (
                <>
                  <Check size={18} color="#8DE0C3" />
                  <span>Preferences Updated!</span>
                </>
              ) : (
                <>
                  <Save size={18} color="#8DE0C3" />
                  <span>Save Preferences & Update Routine</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
