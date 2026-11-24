import { generateAssistantResponse } from './server/services/geminiService.js';
(async () => {
  const res = await generateAssistantResponse({ message: 'Hello', timeoutMs: 1 });
  console.log(JSON.stringify(res, null, 2));
})();
