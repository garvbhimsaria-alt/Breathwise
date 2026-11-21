import React, { useState } from 'react';
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
import { generateRecommendations, classifyAqi } from './engine';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentCity, setCurrentCity] = useState(SAMPLE_CITIES[0]); // default Delhi NCR
  const [activeScenarioId, setActiveScenarioId] = useState('current'); // 'current' | 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe' | 'missing' | 'stale'
  
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

  // Compute active environmental parameters
  const activePreset = SCENARIO_PRESETS.find(s => s.id === activeScenarioId);
  const isSimulated = activeScenarioId !== 'current';
  
  const rawAqi = isSimulated ? activePreset.aqi : currentCity.aqi;
  const rawTimestamp = isSimulated && activePreset.timestamp ? activePreset.timestamp : null;
  
  // -------------------------------------------------------------------------
  // CORE ENGINE INVOCATION
  // -------------------------------------------------------------------------
  // Runs India CPCB classification, rule evaluation, and precaution synthesis
  const engineOutput = generateRecommendations(rawAqi, userProfile, {
    timestamp: rawTimestamp,
    isDemo: true,
    location: currentCity
  });

  const aqiResult = engineOutput.aqiResult;

  const effectiveCity = {
    ...currentCity,
    originalCityName: currentCity.name,
    aqi: aqiResult.aqi,
    pm25: isSimulated ? activePreset.pm25 : currentCity.pm25,
    pm10: isSimulated ? activePreset.pm10 : currentCity.pm10,
    no2: isSimulated ? activePreset.no2 : currentCity.no2,
    temp: isSimulated ? activePreset.temp : currentCity.temp,
    humidity: isSimulated ? activePreset.humidity : currentCity.humidity,
    primaryPollutant: isSimulated ? activePreset.primaryPollutant : currentCity.primaryPollutant,
    isScenarioSimulated: isSimulated,
    scenarioId: isSimulated ? activePreset.id : 'current',
    scenarioLabel: isSimulated ? activePreset.label : 'Live Sample',
    scenarioDesc: isSimulated ? activePreset.desc : currentCity.dataSource,
    aqiResult: aqiResult,
    lastUpdatedText: aqiResult.lastUpdatedText
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
            engineOutput={engineOutput}
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
            engineOutput={engineOutput}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            onUpdateProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'assistant' && (
          <AiAssistant
            currentCity={effectiveCity}
            userProfile={userProfile}
            engineOutput={engineOutput}
            initialQuestion={initialAiQuestion}
          />
        )}

        {activeTab === 'indoor' && (
          <IndoorGuide
            currentCity={effectiveCity}
            userProfile={userProfile}
            engineOutput={engineOutput}
          />
        )}

        {activeTab === 'impact' && (
          <MyImpact
            userProfile={userProfile}
            engineOutput={engineOutput}
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
