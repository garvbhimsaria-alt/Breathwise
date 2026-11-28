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

const CURRENT_CITY_STORAGE_KEY = 'breathewise_current_city';
const START_CITY = {
  id: 'delhi', name: 'Delhi', region: 'Delhi, India', aqi: null, pm25: null, pm10: null,
  isLiveData: true, dataSource: 'OpenAQ v3', locationSource: 'manual',
  liveQuery: { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 }
};

function loadSavedCity() {
  try {
    const saved = JSON.parse(localStorage.getItem(CURRENT_CITY_STORAGE_KEY) || 'null');
    if (!saved?.id) return START_CITY;
    const sample = SAMPLE_CITIES.find(city => city.id === saved.id);
    if (sample && !saved.liveQuery) {
      const cityCoords = {
        delhi: [28.6139,77.2090], mumbai: [19.0760,72.8777], bengaluru: [12.9716,77.5946],
        kolkata: [22.5726,88.3639], chennai: [13.0827,80.2707], hyderabad: [17.3850,78.4867],
        pune: [18.5204,73.8567], lucknow: [26.8467,80.9462]
      }[sample.id];
      return { ...sample, aqi: null, pm25: null, pm10: null, no2: null, o3: null, so2: null, co: null, nh3: null,
        isLiveData: true, locationSource: 'manual', dataSource: 'OpenAQ v3',
        liveQuery: cityCoords ? { city: sample.name, state: sample.region, lat: cityCoords[0], lon: cityCoords[1] } : null };
    }
    return {
      id: saved.id,
      name: saved.name || 'Selected city',
      region: saved.region || 'India',
      liveQuery: saved.liveQuery || null,
      locationSource: saved.locationSource || 'manual',
      isLiveData: saved.isLiveData === true,
      liveStationCoords: saved.liveStationCoords || null,
      aqi: null, pm25: null, pm10: null, no2: null, o3: null, so2: null, co: null, nh3: null,
      dataSource: saved.dataSource || 'Live monitoring data'
    };
  } catch {
    return START_CITY;
  }
}

function saveCitySelection(city) {
  try {
    localStorage.setItem(CURRENT_CITY_STORAGE_KEY, JSON.stringify({
      id: city.id, name: city.name, region: city.region,
      liveQuery: city.liveQuery || null,
      locationSource: city.locationSource || 'manual',
      isLiveData: city.isLiveData === true,
      liveStationCoords: city.liveStationCoords || null,
      dataSource: city.dataSource || null
    }));
  } catch { /* Keep the location selection usable when storage is unavailable. */ }
}
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentCity, setCurrentCity] = useState(loadSavedCity);
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
  // Keeps live readings unavailable when the backend is unreachable.
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
  //   - Otherwise → report unavailable live readings without substituting sample values
  const activePreset = SCENARIO_PRESETS.find(s => s.id === activeScenarioId);
  const isSimulated = activeScenarioId !== 'current';

  // The "base city" for the 'current' scenario:
  // live data when available, selected city metadata otherwise
  const isSelectedLiveCity = currentCity?.isLiveData === true || currentCity?.id?.startsWith('live-') || currentCity?.id?.startsWith('geo-');
  const liveUnavailable = isSelectedLiveCity && dataMode === 'error' && !isSimulated;
  const livePending = isSelectedLiveCity && dataMode === 'loading' && !isSimulated;
  const baseCity = (dataMode === 'live' && liveCity)
    ? liveCity
    : (liveUnavailable ? { ...currentCity, aqi: null, pm25: null, pm10: null, no2: null, o3: null, so2: null, co: null, nh3: null } : currentCity);
  const isLiveActive = dataMode === 'live' && liveCity && !isSimulated;

  const rawAqi = isSimulated ? activePreset.aqi : (liveUnavailable ? null : baseCity.aqi);
  const rawTimestamp = isSimulated && activePreset.timestamp ? activePreset.timestamp : null;
  
  // ─── Core Engine Invocation ───────────────────────────────────
  const engineOutput = generateRecommendations(rawAqi, userProfile, {
    timestamp: rawTimestamp,
    isDemo: !isLiveActive && !liveUnavailable && !livePending,
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
    scenarioLabel: isSimulated ? activePreset.label : (isLiveActive ? 'Live Data' : (liveUnavailable ? 'Live data unavailable' : (livePending ? 'Loading live data' : 'Demo Sample'))),
    scenarioDesc: isSimulated ? activePreset.desc : (isLiveActive ? (baseCity.dataSource || 'Live Station') : (liveUnavailable ? lastFetchError : currentCity.dataSource)),
    aqiResult: aqiResult,
    lastUpdatedText: isLiveActive ? (baseCity.lastUpdated || aqiResult.lastUpdatedText) : aqiResult.lastUpdatedText,
    // Live-data metadata for components
    dataMode: dataMode,
    dataUnavailable: liveUnavailable,
    dataLoading: livePending,
    dataError: liveUnavailable ? lastFetchError : null,
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
        const cityCoords = {
          delhi: [28.6139,77.2090], mumbai: [19.0760,72.8777], bengaluru: [12.9716,77.5946],
          kolkata: [22.5726,88.3639], chennai: [13.0827,80.2707], hyderabad: [17.3850,78.4867],
          pune: [18.5204,73.8567], lucknow: [26.8467,80.9462]
        }[match.id];
        const liveSelection={...match,aqi:null,pm25:null,pm10:null,no2:null,o3:null,so2:null,co:null,nh3:null,
          isLiveData:true,dataSource:'OpenAQ v3',locationSource:'manual',
          liveQuery:cityCoords?{city:match.name,state:match.region,lat:cityCoords[0],lon:cityCoords[1]}:null};
        setCurrentCity(liveSelection);
        saveCitySelection(liveSelection);
        setActiveScenarioId('current');
      }
    }
  };

  const handleSelectCity = (city) => {
    setCurrentCity(city);
    saveCitySelection(city);
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
      <DataNoticeBanner currentCity={effectiveCity} onOpenAi={() => setActiveTab('assistant')} onRefresh={refreshLiveData} />

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
