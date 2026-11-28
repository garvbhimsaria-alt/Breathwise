# BreatheWise 🌿
> **Breathe better. Live smarter.**  
> *Personalized urban air-quality intelligence, CPCB decision-engine schedule planning, and grounded Gemini AI companion.*

---

## 1. Project Overview & Problem Statement

Urban air pollution—particularly seasonal winter smog in metropolitan areas like Delhi NCR, Mumbai, and northern India—presents an acute public health challenge. Fine particulate matter (PM2.5 and PM10) reaches levels 10 to 30 times higher than World Health Organization safe guidelines, exacerbating asthma, cardiovascular disease, and chronic respiratory illness.

However, existing air-quality apps have critical flaws:
- **Passive Numbers Without Context:** They display raw numbers (e.g. "AQI 320") without explaining what actions an individual should take.
- **Unrealistic Advice:** They issue generic blanket statements such as *"Stay indoors"*—unhelpful for daily commuters, students, or field workers who cannot skip their responsibilities.
- **Overlooking Indoor Micro-Environments:** People spend up to 90% of their time indoors, yet most tools ignore indoor ventilation, cooking emissions, and window infiltration.
- **Inequitable Assumptions:** Many apps assume every user owns an expensive motorized HEPA air purifier, ignoring low-cost physical mitigation measures like wet damp-mop cleaning, draft-proofing, and cross-ventilation windows.
- **Unreliable "Black Box" AI Chatbots:** Unconstrained AI models hallucinate sensor telemetry, invent pollutant numbers, or provide unsafe medical diagnoses.

---

## 2. Why BreatheWise Was Created

BreatheWise was built to bridge the gap between raw atmospheric monitoring data and actionable daily human decisions. It transforms complex Central Pollution Control Board (CPCB) continuous monitoring telemetry into personalized routines, explainable precautions, and grounded conversational advice tailored to each person's lifestyle, commute, and home setup.

---

## 3. Target Users

1. **Daily Commuters & Working Professionals:** Need realistic transit precautions (e.g. metro vs. two-wheeler, cabin air recirculation, rush-hour smog avoidance).
2. **Students & Young Adults:** Need campus transit advice, library indoor study slots, and schedule adjustments around peak smog hours.
3. **Outdoor & Field Workers:** Require emergency N95 respirator safety rules, hydration advisories, and outdoor shift adjustments in Severe AQI.
4. **Households Without Air Purifiers:** Seek defensible, low-cost physical measures (strategic sealing, wet mopping, cooking ventilation) without false promises.
5. **Vulnerable & Health-Sensitive Individuals:** Families with asthmatic individuals, infants, or elderly relatives who need heightened sensitivity alerts.

---

## 4. Main Features

- 📊 **OpenAQ Ambient Dashboard:** Displays recent readings from OpenAQ locations identified as CPCB-source, with pollutant values, timestamps, freshness, and a clearly labelled real-time AQI estimate when coverage allows.
- 🎛️ **CPCB Decision Engine Scenario Controller:** Instantly simulate all 6 official CPCB NAQI breakpoints (*Good*, *Satisfactory*, *Moderate*, *Poor*, *Very Poor*, *Severe*) as well as missing or stale sensor states to verify deterministic safety rules.
- 🗓️ **"Your Day, Reimagined" Dynamic Routine:** Generates an explainable 4-phase daily schedule (Morning, Commute, Evening, Night) anchored to the user's target wake-up time, adjusting cardio, window ventilation, and transit around peak inversion hours.
- 💬 **Grounded Gemini AI Assistant:** Google Gemini Developer API integration that answers contextual questions about workouts, commutes, and routines while strictly respecting Decision Engine safety guardrails.
- 🏡 **Indoor Air Guide:** Actionable indoor air defense categorized into ventilation, kitchen exhaust, damp-mop dusting, and low-cost DIY window draft sealing.
- 🚲 **My Impact Transit Calculator:** Benchmarks avoided CO2 (kg) and particulate soot (g) when transitioning from solo petrol cars to electric metro rail or cycling, backed by ARAI/IPCC factors.
- 👤 **Personalized Profile & Schedule Anchoring:** Allows users to save their occupation, commute mode, exercise habits, wake-up schedule, and air purifier setup with zero server-side personal data harvesting.

---

## 5. Technology Stack

### Frontend
- **Framework:** React 18 (SPA)
- **Tooling & Bundler:** Vite 6
- **Icons:** Lucide React
- **Styling:** Custom responsive design system with CSS custom properties, WCAG 2.1 AA focus indicators, and mobile-friendly bottom navigation.

### Backend Proxy
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 4
- **Security & Utilities:** CORS with configurable origins, sliding-window in-memory rate limiting (30 req/min/IP), JSON body size caps (100kb), Dotenv.

### Generative AI
- **SDK:** Google Official JavaScript SDK (`@google/genai` v3)
- **Default Model:** `gemini-3.8-flash` (configurable via `GEMINI_MODEL`)
- **System Guardrails:** Persona-anchored prompt engineering enforcing Decision Engine safety primacy, JSON response schemas, and bounded input sanitization.

### Data Providers & Standards
- **Only AQI provider:** OpenAQ v3 locations marked as CPCB-source; the backend does not call data.gov.in.
- **Secondary Fallback Provider:** OpenAQ v3 API
- **Index Standard:** Indian CPCB National Air Quality Index (NAQI) piecewise linear sub-index formula

---

## 6. Architecture & Data Flow

```
                      ┌───────────────────────────────────────┐
                      │    BreatheWise React Frontend (SPA)   │
                      │  Dashboard • Routine • Guide • Impact │
                      └──────────────────┬────────────────────┘
                                         │  fetch('/api/*')
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    Node.js Express Proxy (Port 5000)  │
                      │  Rate Limiting • CORS • Sanitization  │
                      └───────┬──────────────────────┬────────┘
                              │                      │
             ┌────────────────▼─────────┐   ┌────────▼─────────────────┐
             │ OpenAQ v3 API            │   │ Google Gemini Flash API  │
             │   (OpenAQ v3 Fallback)   │   │ (@google/genai SDK)      │
             └──────────────────────────┘   └──────────────────────────┘
```

1. **Client Privacy:** The browser never directly contacts external APIs. All API keys remain securely on the backend server.
2. **Context-Grounding Pipeline:** When the user chats with the assistant, the backend injects the current AQI, station name, user role, commute type, and Decision Engine rules into a structured system prompt.
3. **Structured Response Contract:** Gemini returns structured JSON (`message`, `recommendations`, `reasoning`, `alternatives`, `limitations`), parsed and validated server-side.

---

## 7. How the CPCB Decision Engine Works

The core of BreatheWise is deterministic and rule-based:

1. **Breakpoint Sub-Index Calculation:** Evaluates pollutant concentrations against CPCB breakpoints:
   $$\text{Sub-Index } I_p = \frac{I_{\text{HI}} - I_{\text{LO}}}{B_{\text{HI}} - B_{\text{LO}}} \times (C_p - B_{\text{LO}}) + I_{\text{LO}}$$
2. **Composite AQI Requirements:** Enforces the official CPCB rule that an overall AQI requires at least 3 pollutants with valid observations, including at least one particulate pollutant (PM2.5 or PM10). If not met, displays "AQI Unavailable" and shows individual readings without inventing numbers.
3. **Averaging Period Integrity:** 24-hour averages for PM2.5/PM10; 8-hour averages for CO/O3. Real-time telemetry is clearly flagged as instantaneous observation data.
4. **Actionable Precaution Trees:** Maps combinations of `[AQI Category] + [Lifestyle] + [Exercise Habit] + [Commute] + [Air Purifier Setup]` into prioritized precaution cards with explainable scientific rationale.

---

## 8. Setup & Local Development

### Prerequisites
- Node.js `v18+` (Tested on Node.js `v20+` and `v26`)
- npm `v9+`

### 1. Clone the Repository
```bash
git clone https://github.com/garvbhimsaria-alt/Breathwise.git
cd Breathwise
```

### 2. Install Dependencies
```bash
# Install frontend root dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# AQI Provider: OpenAQ v3 (required for live measurements)
OPENAQ_API_KEY=your_openaq_api_key

# Conversational Assistant: Google Gemini Developer API
# Obtain a free key at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash

# Backend Server Port
PORT=5000
```

### 4. Run the Development Servers
Run both local services with one command:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:3000`; the backend uses port 5000. If you run the backend separately, use `npm run server` and then `npm run dev:web`.)*

---

## 9. Automated Testing

BreatheWise includes an automated test suite using Node.js's native test runner (`node:test`):

```bash
npm test
```

### Test Coverage Highlights:
- **`tests/decisionEngine.test.js` (50 tests):** CPCB thresholds, user lifestyles (student, outdoor worker, WFH), commute impact math, and intent routing.
- **`tests/serverAqiCalculator.test.js` (35 tests):** CPCB piecewise linear math, zero concentration handling, unit conversions (ppb to µg/m³), and freshness classifications.
- **`tests/geminiAssistant.test.js` (18 tests):** Context prompt construction, multi-turn history sanitization, token bounding, and structured JSON parsing.
- **`tests/finalAudit.test.js` (19 tests):** Pre-deployment audit scenarios, timeline schedule anchoring, prompt-injection defense, and non-purifier safety bounds.
- **`tests/openaqStationSelection.test.js`:** Nearest-first live station selection and reference AQI breakpoint examples.

### Manual QA Checklist
- Search Delhi, Pune, and Mumbai; confirm rows are city/locality groups, then select each and verify the live station name, source, timestamp, and distance.
- Search a smaller city; if OpenAQ has no recent CPCB-source PM reading, confirm the app says live readings are unavailable and never substitutes sample values.
- Allow browser location and confirm nearest station distance is measured from the browser coordinates. Deny permission and confirm the approximate IP location is clearly labeled.
- Stop the backend or disconnect the network; confirm the banner offers Retry and no live city is replaced by demo measurements.
- Reload after choosing a city/current location; confirm the selection persists and the backend refreshes readings.

### Production Build:
```bash
npm run build
```
Compiles a minified production bundle in `dist/` with zero errors.

---

## 10. Deployment Architecture (Free-Tier Stack)

BreatheWise is structured for 100% free hosting:

| Component | Platform | Configuration |
|---|---|---|
| **Frontend SPA** | **Cloudflare Pages** | Build command: `npm run build`<br>Output directory: `dist`<br>Client-side routing: Handled via `public/_redirects` |
| **Backend API** | **Render (Free Web Service)** | Root directory: `server`<br>Build command: `npm install`<br>Start command: `node index.js`<br>Environment variables: `OPENAQ_API_KEY`, `GEMINI_API_KEY`, `CLIENT_ORIGIN` |

### Free-Tier Limitations to Note:
1. **Render Cold Starts:** Render's free web services spin down after 15 minutes of inactivity. When a request arrives after sleep, spin-up may take 45–50 seconds. BreatheWise handles this gracefully: if the backend is waking up, the frontend displays clear loading states and falls back to demonstration mode rather than crashing.
2. **Cloudflare Pages Routing:** Pure static hosting requires redirecting all non-asset routes to `index.html`. BreatheWise includes a `public/_redirects` file that automatically enables seamless browser reloads.

---

## 11. Known Limitations & Transparency Disclosures

1. **Ambient Outdoor vs. Indoor Air:** Ambient monitoring stations measure outdoor atmospheric air. Indoor air quality varies significantly based on cooking, ventilation, and mechanical purifiers. BreatheWise explicitly labels all station telemetry as ambient.
2. **Averaging Coverage:** Official CPCB 24-hour averages require at least 16 hours of continuous monitoring (67% observation coverage). Real-time hourly readings are transparently identified as instantaneous observation estimates.
3. **No Medical Guarantees:** BreatheWise provides exposure reduction strategies grounded in atmospheric physics and occupational health guidelines; it does not provide clinical diagnoses or medical prescriptions.

---

## 12. Future Improvements

- [ ] Support for user-connected Bluetooth indoor air sensors (e.g. Sensirion, AirGradient) to display real-time indoor vs. outdoor differentials.
- [ ] Multi-city comparative commute route planner with pollution heatmaps.
- [ ] Push notifications for morning peak inversion warnings.
- [ ] Multilingual support for Hindi, Bengali, Tamil, and other regional Indian languages.

---

## 13. License & Attribution

- **License:** MIT License.
- **Data Attribution:**
  - Ambient air quality measurements are fetched through OpenAQ v3. Source attribution varies by monitoring location; the app labels the selected station as a CPCB-source location only when OpenAQ metadata indicates that source.
  - OpenAQ data provided under respective open station licenses.
- **AI Attribution:** Powered by Google Gemini Developer API.
