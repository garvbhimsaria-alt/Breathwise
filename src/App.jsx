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
import { useLiveAqi } from './hooks/useLiveAqi';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentCity, setCurrentCity] = useState(SAMPLE_CITIES[0]); // default Delhi NCR
  const [activeScenarioId, setActiveScenarioId] = useState('current');
  
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
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(() => {
    const saved = localStorage.getItem('breathewise_profile');
    if (!saved) return true; // First-time user: automatically guide through setup
    try {
      const parsed = JSON.parse(saved);
      return !parsed.hasCompletedOnboarding;
    } catch (e) {
      return false;
    }
  });
  const [initialAiQuestion, setInitialAiQuestion] = useState(null);

  // ─── Live Data Hook ───────────────────────────────────────────
  // Attempts to fetch real air quality data from the backend.
  // Falls back to demonstration mode when backend is unreachable.
  const {
    liveCity,
    dataMode,
    backendStatus,
    lastFetchError,
    refreshLiveData
  } = useLiveAqi(currentCity);

  // ─── Determine effective data source ──────────────────────────
  // When a scenario preset is active, always use that preset (simulation).
  // When 'current' is selected:
  //   - If live data is available → use live data
  //   - Otherwise → use demo city data
  const activePreset = SCENARIO_PRESETS.find(s => s.id === activeScenarioId);
  const isSimulated = activeScenarioId !== 'current';

  // The "base city" for the 'current' scenario:
  // live data when available, demo data otherwise
  const baseCity = (dataMode === 'live' && liveCity) ? liveCity : currentCity;
  const isLiveActive = dataMode === 'live' && liveCity && !isSimulated;

  const rawAqi = isSimulated ? activePreset.aqi : baseCity.aqi;
  const rawTimestamp = isSimulated && activePreset.timestamp ? activePreset.timestamp : null;
  
  // ─── Core Engine Invocation ───────────────────────────────────
  const engineOutput = generateRecommendations(rawAqi, userProfile, {
    timestamp: rawTimestamp,
    isDemo: !isLiveActive,
    location: baseCity
  });

  const aqiResult = engineOutput.aqiResult;

  const effectiveCity = {
    ...baseCity,
    originalCityName: currentCity.name,
    aqi: aqiResult.aqi,
    pm25: isSimulated ? activePreset.pm25 : baseCity.pm25,
    pm10: isSimulated ? activePreset.pm10 : baseCity.pm10,
    no2: isSimulated ? activePreset.no2 : baseCity.no2,
    temp: isSimulated ? (activePreset.temp ?? baseCity.temp) : baseCity.temp,
    humidity: isSimulated ? (activePreset.humidity ?? baseCity.humidity) : baseCity.humidity,
    primaryPollutant: isSimulated ? activePreset.primaryPollutant : baseCity.primaryPollutant,
    isScenarioSimulated: isSimulated,
    scenarioId: isSimulated ? activePreset.id : 'current',
    scenarioLabel: isSimulated ? activePreset.label : (isLiveActive ? 'Live Data' : 'Demo Sample'),
    scenarioDesc: isSimulated ? activePreset.desc : (isLiveActive ? (baseCity.dataSource || 'Live Station') : currentCity.dataSource),
    aqiResult: aqiResult,
    lastUpdatedText: isLiveActive ? (baseCity.lastUpdated || aqiResult.lastUpdatedText) : aqiResult.lastUpdatedText,
    // Live-data metadata for components
    dataMode: dataMode,
    isLiveData: isLiveActive,
    liveStation: isLiveActive ? baseCity.liveStation : null,
    liveAqiLabel: isLiveActive ? baseCity.liveAqiLabel : null,
    liveAttribution: isLiveActive ? baseCity.liveAttribution : null,
    liveFreshness: isLiveActive ? baseCity.liveFreshness : null,
    liveMeasurementTime: isLiveActive ? baseCity.liveMeasurementTime : null,
    liveIsCpcb: isLiveActive ? baseCity.liveIsCpcb : null,
    liveSubIndices: isLiveActive ? baseCity.liveSubIndices : null,
    pollutantUnits: isLiveActive ? baseCity.pollutantUnits : null,
    averagingPeriodNote: isLiveActive ? baseCity.averagingPeriodNote : null
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
      <DataNoticeBanner currentCity={effectiveCity} onOpenAi={() => setActiveTab('assistant')} />

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
            onNavigateToTab={setActiveTab}
            onAskAiQuestion={handleAskAiQuestion}
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
