import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DataNoticeBanner from './components/DataNoticeBanner';
import Dashboard from './components/Dashboard';
import DailyRoutine from './components/DailyRoutine';
import AiAssistant from './components/AiAssistant';
import IndoorGuide from './components/IndoorGuide';
import MyImpact from './components/MyImpact';
import LocationModal from './components/LocationModal';
import ProfileModal from './components/ProfileModal';
import OnboardingModal from './components/OnboardingModal';
import { SAMPLE_CITIES, INITIAL_USER_PROFILE, SCENARIO_PRESETS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentCity, setCurrentCity] = useState(SAMPLE_CITIES[0]); // default Delhi NCR
  const [activeScenarioId, setActiveScenarioId] = useState('current'); // 'current' | 'good' | 'moderate' | 'poor' | 'severe'
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('breathewise_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_USER_PROFILE;
      }
    }
    return INITIAL_USER_PROFILE;
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [initialAiQuestion, setInitialAiQuestion] = useState(null);

  // Compute effective city data synchronized across Dashboard, Daily Routine, and AI Assistant
  const activePreset = SCENARIO_PRESETS.find(s => s.id === activeScenarioId);
  const effectiveCity = activePreset ? {
    ...currentCity,
    originalCityName: currentCity.name,
    name: `${currentCity.name}`,
    aqi: activePreset.aqi,
    pm25: activePreset.pm25,
    pm10: activePreset.pm10,
    no2: activePreset.no2,
    temp: activePreset.temp,
    humidity: activePreset.humidity,
    primaryPollutant: activePreset.primaryPollutant,
    isScenarioSimulated: true,
    scenarioId: activePreset.id,
    scenarioLabel: activePreset.label,
    scenarioDesc: activePreset.desc
  } : {
    ...currentCity,
    originalCityName: currentCity.name,
    isScenarioSimulated: false,
    scenarioId: 'current',
    scenarioLabel: 'Live Sample'
  };

  // Sync profile changes to localStorage
  const handleSaveProfile = (newProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('breathewise_profile', JSON.stringify(newProfile));
    // If user changed preferred city in profile, reflect it
    if (newProfile.cityId && newProfile.cityId !== currentCity.id) {
      const match = SAMPLE_CITIES.find(c => c.id === newProfile.cityId);
      if (match) {
        setCurrentCity(match);
        setActiveScenarioId('current');
      }
    }
  };

  const handleSelectCity = (city) => {
    setCurrentCity(city);
    setActiveScenarioId('current');
    setUserProfile(prev => ({
      ...prev,
      cityId: city.id
    }));
  };

  const handleAskAiQuestion = (question) => {
    setInitialAiQuestion(question);
    setActiveTab('assistant');
  };

  return (
    <div className="app-container">
      {/* Top Prototype & Architecture Notice Banner */}
      <DataNoticeBanner onOpenAi={() => setActiveTab('assistant')} />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCity={effectiveCity}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        userName={userProfile.name}
      />

      {/* Main Content View Switcher */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            currentCity={effectiveCity}
            userProfile={userProfile}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onNavigateToTab={setActiveTab}
            onAskAiQuestion={handleAskAiQuestion}
          />
        )}

        {activeTab === 'routine' && (
          <DailyRoutine
            currentCity={effectiveCity}
            userProfile={userProfile}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            onUpdateProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'assistant' && (
          <AiAssistant
            currentCity={effectiveCity}
            userProfile={userProfile}
            initialQuestion={initialAiQuestion}
          />
        )}

        {activeTab === 'indoor' && (
          <IndoorGuide
            currentCity={effectiveCity}
          />
        )}

        {activeTab === 'impact' && (
          <MyImpact
            userProfile={userProfile}
          />
        )}
      </main>

      {/* Modals */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
