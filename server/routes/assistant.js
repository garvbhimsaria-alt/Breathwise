/**
 * BreatheWise — /api/assistant routes
 *
 * Provides endpoints for the Gemini-powered conversational assistant:
 *   POST /api/assistant/chat   → Processes user question with context and history
 *   GET  /api/assistant/status → Reports whether Gemini is configured and ready
 */

import { Router } from 'express';
import {
  generateAssistantResponse,
  isGeminiConfigured,
  getGeminiModel
} from '../services/geminiService.js';

const router = Router();

// In-memory sliding window rate limiter: max 30 requests per minute per IP
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    requestCounts.set(ip, record);
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  requestCounts.set(ip, record);
  return true;
}

// Periodic cleanup of stale rate limiter records
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ── GET /api/assistant/status ─────────────────────────────────
router.get('/status', (_req, res) => {
  const configured = isGeminiConfigured();
  res.json({
    status: configured ? 'ready' : 'key_missing',
    configured,
    model: getGeminiModel(),
    provider: 'Google Gemini Developer API'
  });
});

// ── POST /api/assistant/chat ──────────────────────────────────
router.post('/chat', async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client';

  // 1. Rate Limit Check
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      status: 'error',
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment before sending another message.'
    });
  }

  // 2. Validate Request Body
  const {
    message,
    conversationHistory,
    aqiContext,
    userProfile,
    engineRecommendations
  } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      error: 'INVALID_REQUEST',
      message: 'A non-empty string "message" field is required.'
    });
  }

  // 3. Call Gemini Service
  try {
    const result = await generateAssistantResponse({
      message,
      conversationHistory,
      aqiContext,
      userProfile,
      engineRecommendations
    });

    if (result.status === 'fallback') {
      // Return 200 with fallback status so frontend can display clean offline guidance
      return res.json(result);
    }

    return res.json(result);
  
} catch (err) {
  console.error('[Assistant Route Error]', err);

  return res.status(200).json({
    status: 'fallback',
    error: 'INTERNAL_ERROR',
    message: 'The AI assistant is temporarily unavailable. Please try again.',
    data: null
  });
}

});

export default router;
