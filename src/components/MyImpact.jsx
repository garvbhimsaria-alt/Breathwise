import React, { useState } from 'react';
import { 
  Leaf, 
  Car, 
  Train, 
  Bus, 
  Bike, 
  Home, 
  Plus, 
  TrendingUp, 
  Info, 
  Check, 
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { INITIAL_IMPACT_LOGS } from '../data/mockData';
import { 
  calculateCommuteImpact, 
  compareAllCommuteModes, 
  TRANSIT_EMISSION_BENCHMARKS 
} from '../engine';

export default function MyImpact({ userProfile }) {
  const [logs, setLogs] = useState(INITIAL_IMPACT_LOGS);
  const [mode, setMode] = useState('metro');
  const [distanceKm, setDistanceKm] = useState(userProfile.commuteDistanceKm || 12);
  const [noteText, setNoteText] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [inputError, setInputError] = useState(null);

  // Compute live comparative matrix across transit modes using core decision engine
  const comparativeMatrix = compareAllCommuteModes(distanceKm);

  // Compute total aggregates across logged entries
  const totalCo2SavedKg = logs.reduce((acc, curr) => acc + (Number(curr.co2SavedKg) || 0), 0);
  const totalPmSavedG = logs.reduce((acc, curr) => acc + (Number(curr.pmSavedG) || 0), 0);
  const streakDays = logs.length;

  const modeDetails = {
    metro: { label: 'Metro / Electric Rail', icon: Train },
    bus: { label: 'Public Bus', icon: Bus },
    carpool: { label: 'Carpooling (2+)', icon: Car },
    active: { label: 'Walking / Bicycle', icon: Bike },
    wfh: { label: 'Work from Home', icon: Home }
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    setInputError(null);

    // Run calculation through core engine
    const impactResult = calculateCommuteImpact(mode, distanceKm, 'car');

    if (!impactResult.valid) {
      setInputError(impactResult.error || 'Please enter a valid trip distance.');
      return;
    }

    const config = modeDetails[mode] || { label: 'Sustainable Transit' };

    const newEntry = {
      id: `log-${Date.now()}`,
      date: 'Today',
      mode: mode,
      modeName: config.label,
      distanceKm: Number(distanceKm),
      co2SavedKg: impactResult.co2AvoidedKg,
      pmSavedG: impactResult.pmAvoidedGrams,
      notes: noteText || `Clean commute logged via ${config.label}`
    };

    setLogs([newEntry, ...logs]);
    setNoteText('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#EBF8F4',
          color: '#065F46',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          <Leaf size={14} />
          Clean Transit & Urban Air Action
        </div>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: '#102E35',
          letterSpacing: '-0.03em',
          lineHeight: 1.2
        }}>
          My Impact — Sustainable Transit Calculator
        </h1>
        <p style={{ fontSize: '0.925rem', color: '#6B878D', marginTop: '6px', maxWidth: '820px' }}>
          Vehicular exhaust and brake dust account for up to 40% of ground-level urban winter smog. Track your transition toward mass transit, cycling, and low-emission commuting with our transparent decision engine benchmarks.
        </p>
      </div>

      {/* Aggregate Impact Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Total CO2 Saved */}
        <div className="card" style={{ padding: '22px', borderRadius: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase', marginBottom: '6px' }}>
            Estimated CO2 Displaced
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#102E35', lineHeight: 1.1 }}>
            {totalCo2SavedKg.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#20464A' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065F46', marginTop: '6px', fontWeight: 600 }}>
            Estimated vs. private solo petrol car baseline
          </div>
        </div>

        {/* Estimated Particulate Avoided */}
        <div className="card" style={{ padding: '22px', borderRadius: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase', marginBottom: '6px' }}>
            Estimated Road PM Avoided
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#20464A', lineHeight: 1.1 }}>
            {totalPmSavedG.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#20464A' }}>grams</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B878D', marginTop: '6px' }}>
            Direct diesel soot and tire brake dust displaced
          </div>
        </div>

        {/* Sustainable Habit Streak */}
        <div className="card" style={{ padding: '22px', borderRadius: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B878D', textTransform: 'uppercase', marginBottom: '6px' }}>
            Clean Commute Logs
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#065F46', lineHeight: 1.1 }}>
            {streakDays} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#065F46' }}>trips</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B878D', marginTop: '6px' }}>
            Verified log records in local engine storage
          </div>
        </div>
      </div>

      {/* Transit Modes Comparative Matrix (Section 7 Requirement) */}
      <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35' }}>
              Commute Modes Comparative Matrix ({distanceKm || 0} km Trip)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B878D' }}>
              Side-by-side emissions comparison against a solo petrol passenger car baseline
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#102E35' }}>Commute Distance:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              style={{
                width: '70px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1.5px solid #8DE0C3',
                backgroundColor: '#F3F8F6',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#102E35',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.8rem', color: '#6B878D', fontWeight: 600 }}>km</span>
          </div>
        </div>

        {comparativeMatrix && comparativeMatrix.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2ECE9', textAlign: 'left', color: '#6B878D' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Transit Option</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Emissions Factor</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Trip CO2</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>CO2 Avoided</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>PM Avoided</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Displacement</th>
                </tr>
              </thead>
              <tbody>
                {comparativeMatrix.map((row) => {
                  const isBaseline = row.mode === 'car';
                  const benchmark = TRANSIT_EMISSION_BENCHMARKS[row.mode];

                  return (
                    <tr 
                      key={row.mode}
                      style={{
                        borderBottom: '1px solid #E2ECE9',
                        backgroundColor: isBaseline ? '#FEF2F2' : (row.percentReduction >= 70 ? '#ECFDF5' : 'transparent'),
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 700, color: '#102E35' }}>
                        {row.modeLabel} {isBaseline && <span style={{ fontSize: '0.7rem', color: '#DC2626' }}>(Baseline)</span>}
                      </td>
                      <td style={{ padding: '12px', color: '#6B878D', fontSize: '0.775rem' }}>
                        {benchmark ? `${benchmark.co2PerPassengerKm}g CO2/km` : '—'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#102E35' }}>
                        {row.co2EmittedKg} kg
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: isBaseline ? '#6B878D' : '#065F46' }}>
                        {isBaseline ? '0.00 kg' : `-${row.co2AvoidedKg} kg`}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: isBaseline ? '#6B878D' : '#20464A' }}>
                        {isBaseline ? '0.000g' : `-${row.pmAvoidedGrams}g`}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isBaseline ? (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Baseline (0%)</span>
                        ) : (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: row.percentReduction >= 70 ? '#A7F3D0' : '#E2ECE9',
                            color: row.percentReduction >= 70 ? '#065F46' : '#20464A'
                          }}>
                            {row.percentReduction}% Cleaner
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6B878D', fontSize: '0.85rem' }}>
            Enter a valid distance above 0 km to view comparative transit emissions.
          </div>
        )}
      </div>

      {/* Main Action Area: Logger + Log History */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 420px) 1fr',
        gap: '24px',
        alignItems: 'start'
      }} className="impact-grid">
        
        {/* Left: Interactive Clean Trip Logger Form */}
        <div className="card" style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#102E35', marginBottom: '4px' }}>
            Log a Clean Choice Today
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#6B878D', marginBottom: '18px' }}>
            Record an eco-friendly commute or work arrangement
          </p>

          <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mode selection buttons */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#102E35', marginBottom: '6px', textTransform: 'uppercase' }}>
                Mode of Mobility
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {Object.keys(modeDetails).map((key) => {
                  const item = modeDetails[key];
                  const Icon = item.icon;
                  const isSelected = mode === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? '#8DE0C3' : '#E2ECE9'}`,
                        backgroundColor: isSelected ? 'rgba(141, 224, 195, 0.15)' : '#F3F8F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: '#102E35',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={16} color={isSelected ? '#102E35' : '#6B878D'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commute Distance */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#102E35', marginBottom: '6px', textTransform: 'uppercase' }}>
                Distance Shifted (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #E2ECE9',
                  backgroundColor: '#F3F8F6',
                  fontSize: '0.9rem',
                  color: '#102E35',
                  outline: 'none',
                  fontWeight: 600
                }}
                required
              />
            </div>

            {/* Optional Note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#102E35', marginBottom: '6px', textTransform: 'uppercase' }}>
                Trip Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Took Metro Yellow Line to work"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #E2ECE9',
                  backgroundColor: '#F3F8F6',
                  fontSize: '0.85rem',
                  color: '#102E35',
                  outline: 'none'
                }}
              />
            </div>

            {inputError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.775rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                <span>{inputError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '14px',
                marginTop: '4px'
              }}
            >
              <Plus size={18} color="#8DE0C3" />
              <span>Log Sustainable Choice</span>
            </button>

            {showSuccessToast && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check size={16} color="#10B981" />
                <span>Impact successfully recorded and stats updated!</span>
              </div>
            )}
          </form>
        </div>

        {/* Right: History Log & Benchmarking Methodology */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35', marginBottom: '4px' }}>
              Your Recent Clean Mobility History
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#6B878D', marginBottom: '16px' }}>
              Recorded contributions to lowering urban peak particulate loads
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#F3F8F6',
                    border: '1px solid #E2ECE9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #C5DDD7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Leaf size={18} color="#20464A" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#102E35' }}>
                        {item.modeName} ({item.distanceKm} km)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B878D' }}>
                        {item.date} • {item.notes}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065F46' }}>
                      -{item.co2SavedKg} kg CO2
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6B878D' }}>
                      -{item.pmSavedG}g PM
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defensible Calculation Methodology Disclosure & Critical Medical Boundary */}
          <div style={{
            padding: '18px 22px',
            borderRadius: '18px',
            backgroundColor: '#F3F8F6',
            border: '1px solid #E2ECE9',
            fontSize: '0.775rem',
            color: '#6B878D',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Info size={18} color="#20464A" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#102E35' }}>Methodological Integrity & Transparency Boundary:</strong>
              <br />
              1. <strong>Documented Emissions Benchmarks:</strong> Calculations utilize peer-reviewed urban transit factors (~140g CO2/km for a baseline solo petrol passenger car vs. ~32g for urban electric mass transit rail, documented by IPCC / ARAI).
              <br />
              2. <strong>Environmental vs. Personal Health Separation:</strong> Emissions avoided represent <em>collective atmospheric emissions reductions</em>. They are <strong>never</strong> presented as a direct measurement of personal lung deposition, blood oxygenation, or individual health improvement.
              <br />
              3. <strong>No Fabricated Data:</strong> All outputs are transparent mathematical estimates. In the absence of valid distance data, calculations return explicit validation notices rather than invented precise figures.
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 820px) {
          .impact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
