import React, { useState } from 'react';
import { Info, X, Sparkles, Database, Radio } from 'lucide-react';

export default function DataNoticeBanner({ currentCity, onOpenAi }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isLive = currentCity?.isLiveData;

  return (
    <div style={{
      backgroundColor: '#102E35',
      color: '#FFFFFF',
      borderBottom: '1px solid #20464A',
      padding: '8px 16px',
      fontSize: '0.825rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isLive ? (
          <>
            <span style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Radio size={12} />
              Live Station Active
            </span>
            <span style={{ color: '#E2ECE9' }}>
              Connected to <strong>{currentCity.liveStation || currentCity.name}</strong> via {currentCity.dataSource || 'Air Monitoring Net'}. Recommendations evaluate actual telemetry with CPCB rule safety boundaries.
            </span>
          </>
        ) : (
          <>
            <span style={{
              backgroundColor: '#8DE0C3',
              color: '#102E35',
              fontWeight: 700,
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Database size={12} />
              Demonstration Mode
            </span>
            <span style={{ color: '#E2ECE9' }}>
              Air quality and routine recommendations are powered by our <strong>deterministic CPCB decision engine</strong> using clearly labeled demonstration scenarios.
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onOpenAi}
          style={{
            color: '#8DE0C3',
            fontSize: '0.775rem',
            fontWeight: 600,
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px'
          }}
        >
          Preview AI Assistant
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#7E989C',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Dismiss notice"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
