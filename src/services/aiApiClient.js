/**
 * BreatheWise — Frontend AI Assistant API Client
 *
 * Communicates with the backend proxy (/api/assistant/*).
 * Keeps Gemini API credentials strictly on the server.
 */

const API_BASE = '/api/assistant';

/**
 * Check if the Gemini AI service is configured and ready on the backend.
 *
 * @returns {Promise<{ status: string, configured: boolean, model: string }>}
 */
export async function checkAiServiceStatus() {
  try {
    const response = await fetch(`${API_BASE}/status`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return { status: 'error', configured: false, model: null };
    }

    return await response.json();
  } catch (err) {
    return { status: 'offline', configured: false, model: null };
  }
}

/**
 * Send a chat message with full application context to the Gemini assistant.
 *
 * @param {Object} params
 * @param {string} params.message - Current user query
 * @param {Array} [params.conversationHistory=[]] - Previous turns
 * @param {Object} params.aqiContext - Current AQI context
 * @param {Object} params.userProfile - Current user profile
 * @param {Array} params.engineRecommendations - Output from decision engine
 * @returns {Promise<Object>}
 */
export async function sendChatMessage({
  message,
  conversationHistory = [],
  aqiContext = {},
  userProfile = {},
  engineRecommendations = []
}) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        aqiContext,
        userProfile,
        engineRecommendations
      })
    });

    if (response.status === 429) {
      return {
        status: 'error',
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'You have sent several messages quickly. Please wait a moment before sending another.'
      };
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      return {
        status: 'error',
        error: errJson?.error || `HTTP_${response.status}`,
        message: errJson?.message || `Assistant backend returned HTTP ${response.status}.`
      };
    }

    return await response.json();
  } catch (err) {
    return {
      status: 'offline',
      error: 'NETWORK_ERROR',
      message: 'Could not connect to the BreatheWise AI backend. Please verify your server is running.'
    };
  }
}
