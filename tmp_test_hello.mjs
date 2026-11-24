import { generateAssistantResponse } from './server/services/geminiService.js';
(async () => {
  const resp = await generateAssistantResponse({
    message: 'Hello',
    aqiContext: {},
    timeoutMs: 5000
  });
  console.log(JSON.stringify(resp,null,2));
})();
