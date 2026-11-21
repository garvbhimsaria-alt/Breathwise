import React, { useState } from 'react';
import { 
  Wind, 
  Flame, 
  Sparkles, 
  Shield, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Check, 
  Layers,
  Clock,
  HelpCircle
} from 'lucide-react';
import { INDOOR_GUIDE_CARDS } from '../data/mockData';

export default function IndoorGuide({ currentCity }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Guides' },
    { id: 'ventilation', label: 'Ventilation & Windows' },
    { id: 'cooking', label: 'Kitchen & Cooking' },
    { id: 'cleaning', label: 'Dust & Cleaning' },
    { id: 'purifiers', label: 'Air Purifiers' },
    { id: 'affordable', label: 'Affordable DIY Solutions' },
    { id: 'sources', label: 'Hidden Pollutants' }
  ];

  const filteredCards = selectedCategory === 'all'
    ? INDOOR_GUIDE_CARDS
    : INDOOR_GUIDE_CARDS.filter(c => c.category === selectedCategory);

  const iconMap = {
    Wind: Wind,
    Flame: Flame,
    Sparkles: Sparkles,
    Shield: Shield,
    Cpu: Cpu,
    AlertTriangle: AlertTriangle
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: '#102E35',
          letterSpacing: '-0.03em',
          lineHeight: 1.2
        }}>
          Indoor Air Guide — Protect Your Breathing Zone
        </h1>
        <p style={{ fontSize: '0.925rem', color: '#6B878D', marginTop: '6px', maxWidth: '820px' }}>
          We spend up to 90% of our time indoors. Outdoor smog infiltrates living quarters, while cooking, dry dusting, and lack of airflow create hazardous localized air pockets. Here is how to achieve clean indoor air, tailored to current ambient conditions ({currentCity.name}: AQI {currentCity.aqi}).
        </p>
      </div>

      {/* Low-Cost & Non-Purifier Highlight Banner */}
      <div style={{
        backgroundColor: '#EBF8F4',
        border: '1.5px solid #8DE0C3',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: '#102E35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Cpu size={22} color="#8DE0C3" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#102E35', marginBottom: '4px' }}>
            Clean Air Should Be Accessible: Low-Cost Solutions First
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#20464A', lineHeight: 1.5 }}>
            You do <strong>not</strong> need an expensive motorized appliance to improve your indoor air. Strategic window timing (matching diurnal solar dispersion), damp-mop cleaning, door bottom draft-guards, and DIY Corsi-Rosenthal box fans provide up to 80% of the benefits at near-zero expense.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: selectedCategory === cat.id ? 700 : 500,
              backgroundColor: selectedCategory === cat.id ? '#102E35' : '#FFFFFF',
              color: selectedCategory === cat.id ? '#8DE0C3' : '#3D5A60',
              border: `1px solid ${selectedCategory === cat.id ? '#102E35' : '#E2ECE9'}`,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Guide Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredCards.map((card) => {
          const Icon = iconMap[card.icon] || Wind;

          return (
            <div 
              key={card.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                {/* Top Badge & Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#F3F8F6',
                    border: '1px solid #E2ECE9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} color="#20464A" />
                  </div>

                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: card.tag === 'Zero Cost' ? '#ECFDF5' : (card.tag === 'Critical Health' ? '#FEF2F2' : '#F3F8F6'),
                    color: card.tag === 'Zero Cost' ? '#065F46' : (card.tag === 'Critical Health' ? '#991B1B' : '#102E35'),
                    border: '1px solid #E2ECE9'
                  }}>
                    {card.tag}
                  </span>
                </div>

                {/* Title & Summary */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#102E35', marginBottom: '6px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#20464A', marginBottom: '12px', lineHeight: 1.45 }}>
                  {card.summary}
                </p>

                {/* In-depth explanation */}
                <p style={{ fontSize: '0.825rem', color: '#6B878D', lineHeight: 1.55, marginBottom: '16px' }}>
                  {card.content}
                </p>
              </div>

              {/* Actionable Tips Box */}
              <div style={{
                backgroundColor: '#F3F8F6',
                border: '1px solid #E2ECE9',
                borderRadius: '12px',
                padding: '12px 14px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#20464A',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={14} color="#10B981" />
                  <span>Actionable Protocols</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {card.tips.map((tip, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.8rem',
                      color: '#3D5A60',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#8DE0C3', fontWeight: 800, marginTop: '-1px' }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
