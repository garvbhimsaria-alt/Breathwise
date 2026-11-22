import React from 'react';
import { 
  Wind, 
  Calendar, 
  MessageSquare, 
  Home, 
  Leaf, 
  MapPin, 
  User, 
  ShieldCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentCity, 
  onOpenLocationModal, 
  onOpenProfileModal,
  userName 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'routine', label: 'Daily Routine', icon: Calendar, badge: 'Signature' },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare, isAi: true },
    { id: 'indoor', label: 'Indoor Guide', icon: Wind },
    { id: 'impact', label: 'My Impact', icon: Leaf },
  ];

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header style={{
        backgroundColor: '#102E35',
        borderBottom: '1px solid #20464A',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(16, 46, 53, 0.15)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo & Tagline */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('dashboard')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('dashboard'); } }}
            aria-label="BreatheWise Home Dashboard"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#20464A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #8DE0C3',
              boxShadow: '0 0 14px rgba(141, 224, 195, 0.3)'
            }}>
              <Wind size={22} color="#8DE0C3" />
            </div>
            <div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                BreatheWise
                <span style={{
                  fontSize: '0.625rem',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(141, 224, 195, 0.2)',
                  color: '#8DE0C3',
                  borderRadius: '4px',
                  fontWeight: 700,
                  border: '1px solid rgba(141, 224, 195, 0.4)'
                }}>
                  v1.0
                </span>
              </div>
              <div style={{ 
                fontSize: '0.725rem', 
                color: '#8DE0C3', 
                fontWeight: 500,
                letterSpacing: '0.02em'
              }}>
                Breathe better. Live smarter.
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(32, 70, 74, 0.6)',
            padding: '5px',
            borderRadius: '9999px',
            border: '1px solid #20464A'
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#102E35' : '#E2ECE9',
                    backgroundColor: isActive ? '#8DE0C3' : 'transparent',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <Icon size={16} color={isActive ? '#102E35' : (item.isAi ? '#8DE0C3' : '#8DE0C3')} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(141, 224, 195, 0.2)',
                      color: '#8DE0C3',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Action Tools: Location Switcher & Profile Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Location Selector Pill */}
            <button
              onClick={onOpenLocationModal}
              title="Change active location"
              aria-label={`Change location, current location is ${currentCity?.name || 'Select City'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: '9999px',
                backgroundColor: '#20464A',
                border: '1px solid rgba(141, 224, 195, 0.3)',
                color: '#FFFFFF',
                fontSize: '0.825rem',
                fontWeight: 500,
                transition: 'border-color 0.15s ease'
              }}
            >
              <MapPin size={15} color="#8DE0C3" />
              <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentCity?.name || 'Select City'}
              </span>
              <span style={{
                fontSize: '0.625rem',
                backgroundColor: currentCity?.isLiveData 
                  ? '#10B981' 
                  : (currentCity?.isScenarioSimulated ? '#7C3AED' : 'rgba(255, 255, 255, 0.15)'),
                color: (currentCity?.isLiveData || currentCity?.isScenarioSimulated) 
                  ? '#FFFFFF' 
                  : '#8DE0C3',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {currentCity?.isLiveData ? 'Live' : (currentCity?.isScenarioSimulated ? 'Sim' : 'Demo')}
              </span>
              <ChevronDown size={14} color="#7E989C" />
            </button>

            {/* Profile Avatar / Settings Button */}
            <button
              onClick={onOpenProfileModal}
              title="Edit Profile & Routine Preferences"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px 6px 6px',
                borderRadius: '9999px',
                backgroundColor: '#20464A',
                border: '1px solid #20464A',
                color: '#FFFFFF',
                fontSize: '0.825rem',
                fontWeight: 600
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#8DE0C3',
                color: '#102E35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="profile-name-text" style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Profile'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#102E35',
        borderTop: '1px solid #20464A',
        zIndex: 50,
        padding: '8px 6px 12px 6px',
        display: 'none',
        justifyContent: 'space-around',
        boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.2)'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '8px',
                color: isActive ? '#8DE0C3' : '#7E989C',
                flex: 1
              }}
            >
              <Icon size={20} color={isActive ? '#8DE0C3' : '#7E989C'} />
              <span style={{ 
                fontSize: '0.675rem', 
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 880px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          .profile-name-text {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
