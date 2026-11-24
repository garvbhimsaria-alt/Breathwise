import { generateAssistantResponse } from './server/services/geminiService.js';
(async () => {
  const resp = await generateAssistantResponse({
    message: 'Tell me about the current air quality',
    aqiContext: {
      station: 'Station A',
      distanceKm: 4.4,
      isLive: true,
      isDemo: false,
      isStale: false,
      aqi: 85,
      category: 'Moderate'
    },
    timeoutMs: 5000
  });
  console.log(JSON.stringify(resp,null,2));
})();
