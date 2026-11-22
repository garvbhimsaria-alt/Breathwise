/**
 * BreatheWise Backend Server
 *
 * Lightweight Express proxy that:
 *  1. Keeps API credentials server-side (never sent to the browser).
 *  2. Fetches air-quality data from CPCB / data.gov.in and OpenAQ v3.
 *  3. Normalises readings into a single format the React frontend understands.
 *  4. Implements caching and freshness validation.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aqiRoutes from './routes/aqi.js';
import assistantRoutes from './routes/assistant.js';
import { isGeminiConfigured, getGeminiModel } from './services/geminiService.js';

dotenv.config();                // loads .env from project root

const app = express();
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      dataGovIn: process.env.DATA_GOV_IN_API_KEY ? 'key_configured' : 'key_missing',
      openAQ:    process.env.OPENAQ_API_KEY       ? 'key_configured' : 'key_missing',
      gemini:    isGeminiConfigured()             ? 'key_configured' : 'key_missing'
    },
    geminiModel: getGeminiModel()
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/aqi', aqiRoutes);
app.use('/api/assistant', assistantRoutes);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  🌿 BreatheWise backend running on http://localhost:${PORT}`);
  console.log(`     CPCB / data.gov.in key: ${process.env.DATA_GOV_IN_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`     OpenAQ v3 key:          ${process.env.OPENAQ_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`     Gemini AI key:          ${isGeminiConfigured() ? `✓ configured (${getGeminiModel()})` : '✗ missing (set GEMINI_API_KEY in .env)'}\n`);
});
