// BreatheWise — deterministic assistant helpers (no AI calls, no network).
//
// Used for:
//   1. Instant replies that should never depend on Gemini (greetings, thanks,
//      goodbyes, "what's the current AQI").
//   2. "Basic mode" answers when Gemini is unavailable.
//
// RULES (do not break these):
//   - Every AQI statement comes from the context passed in. Nothing is invented.
//   - No "best air" time windows, no hour-by-hour forecasts, no exposure-reduction
//     percentages, no medical claims beyond general category-based guidance.
//   - Demo / stale / unverified / unavailable readings are always labelled.

// ───────────────────────── Text normalization ─────────────────────────

/** Lowercase, drop apostrophes, replace punctuation with spaces, collapse spaces. */
export function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ───────────────────────── AQI facts ─────────────────────────

// India CPCB AQI bands.
const CPCB_BANDS = [
  {
    max: 50,
    name: 'Good',
    advice: ['Air quality is fine for normal outdoor activity.'],
    exercise: 'Outdoor exercise is generally fine.',
    mask: 'A mask is not needed for most people at this level.'
  },
  {
    max: 100,
    name: 'Satisfactory',
    advice: [
      'Most people can go about their day normally.',
      'Unusually sensitive people may notice minor breathing discomfort and may want to take it easier outdoors.'
    ],
    exercise: 'Outdoor exercise is fine for most people; unusually sensitive people may prefer lighter activity.',
    mask: 'Most people do not need a mask at this level.'
  },
  {
    max: 200,
    name: 'Moderate',
    advice: [
      'People with asthma, lung or heart conditions should limit prolonged outdoor exertion.',
      'Everyone else can usually continue normal activity; ease off if you feel discomfort.'
    ],
    exercise:
      'Lighter outdoor activity is fine for most people. If you have asthma or a heart or lung condition, go easy or exercise indoors.',
    mask: 'Most people do not need a mask at this level; if you have a lung or heart condition, ask your doctor.'
  },
  {
    max: 300,
    name: 'Poor',
    advice: [
      'Prolonged outdoor exposure can cause breathing discomfort for many people, so keep outdoor time and heavy exertion short.',
      'Children, older adults and people with asthma, lung or heart conditions should stay indoors as much as possible.'
    ],
    exercise: 'It is better to exercise indoors today.',
    mask:
      'If you will be outside for long, a well-fitted N95/FFP2-type respirator reduces exposure to fine particles. Cloth and surgical masks filter very little of them.'
  },
  {
    max: 400,
    name: 'Very Poor',
    advice: [
      'Avoid outdoor exercise and long stays outdoors.',
      'Keep windows closed and use an air purifier if you have one.',
      'If you must go out, keep it short and consider a well-fitted N95/FFP2-type respirator.'
    ],
    exercise: 'Avoid outdoor exercise today. Indoor activity is the safer choice.',
    mask:
      'A well-fitted N95/FFP2-type respirator can reduce exposure to fine particles when you must be outside. It needs to seal around the nose and cheeks; loose cloth or surgical masks do little.'
  },
  {
    max: Infinity,
    name: 'Severe',
    advice: [
      'Avoid outdoor activity where possible, including walking or cycling commutes.',
      'Keep windows closed and use an air purifier if you have one.',
      'If you must go out, keep it as short as possible and wear a well-fitted N95/FFP2-type respirator.'
    ],
    exercise: 'Do not exercise outdoors today. Stay indoors where possible.',
    mask:
      'If you must go outside, a well-fitted N95/FFP2-type respirator is the better choice. It needs to seal around the nose and cheeks; loose cloth or surgical masks do little.'
  }
];

const UNAVAILABLE_ADVICE = [
  'Without a current reading, take a cautious approach: keep outdoor exertion short, especially if you have asthma, a heart or lung condition, or are a child or older adult.',
  'Check the dashboard or your local CPCB/city advisory for the latest reading.'
];

const MEDICAL_NOTE =
  'If you have a lung or heart condition, or feel breathless, dizzy or have chest pain, follow your doctor’s advice and seek medical care for serious symptoms.';

function bandFor(aqi) {
  return CPCB_BANDS.find((b) => aqi <= b.max) || CPCB_BANDS[CPCB_BANDS.length - 1];
}

/**
 * Turns the aqiContext sent by the frontend into trusted facts.
 * status: 'live' | 'demo' | 'stale' | 'unverified' | 'unavailable'
 */
export function buildAqiFacts(ctx) {
  const c = ctx && typeof ctx === 'object' ? ctx : {};
  const hasAqi = Boolean(c.isValidAqi) && c.aqi !== null && c.aqi !== undefined && Number.isFinite(Number(c.aqi));
  const aqi = hasAqi ? Number(c.aqi) : null;

  let status = 'unavailable';
  if (hasAqi) {
    if (c.isDemo) status = 'demo';
    else if (c.isStale) status = 'stale';
    else if (c.isLiveData) status = 'live';
    else status = 'unverified';
  }

  const band = hasAqi ? bandFor(aqi) : null;
  return {
    hasAqi,
    aqi,
    status,
    band,
    category: hasAqi ? c.category || band.name : null,
    station: c.station || null,
    lastUpdated: c.lastUpdated || null,
    source: c.dataSource || null
  };
}

/** One or two plain sentences describing the reading, always with its status. */
export function describeReading(facts) {
  if (!facts.hasAqi) {
    return 'I do not have a current AQI reading for your location right now.';
  }
  const where = facts.station ? ` at ${facts.station}` : '';
  let text = `The AQI${where} is ${facts.aqi} (${facts.category}).`;
  const updated = facts.lastUpdated ? ` (last updated ${facts.lastUpdated})` : '';

  if (facts.status === 'demo') {
    text += ' This is demo data, not a real measurement, so do not rely on it for real decisions.';
  } else if (facts.status === 'stale') {
    text += ` This reading is stale${updated}, so conditions may have changed.`;
  } else if (facts.status === 'unverified') {
    text += ' I cannot confirm that this reading is live.';
  } else if (facts.lastUpdated) {
    text += ` Last updated: ${facts.lastUpdated}.`;
  }
  return text;
}

// ───────────────────────── Small talk ─────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SMALL_TALK = [
  {
    id: 'greeting',
    test: /^(hi+|hii+|hello+|hey+|heya|hola|yo|namaste|greetings|good (morning|afternoon|evening))( (there|bot|assistant|breathewise|ai))?$/,
    replies: (name) => [
      `Hello${name ? `, ${name}` : ''}! I’m BreatheWise AI. Ask me about the air quality, whether it’s safe to go out, or anything else on your mind.`,
      `Hi${name ? ` ${name}` : ''}! How can I help you today?`,
      `Hey${name ? ` ${name}` : ''}! What would you like to know?`
    ]
  },
  {
    id: 'thanks',
    test: /^((ok|okay|great|cool|nice|perfect) )?(thank ?you|thanks|thank u|thanku|thx|ty|shukriya|dhanyavaad?)( (so|very))?( much| a lot)?( (bot|assistant|breathewise|ai))?$/,
    replies: () => [
      'You’re welcome! Stay safe and breathe easy.',
      'Happy to help! Let me know if you have more questions.',
      'Anytime! I’m here if you need anything else.'
    ]
  },
  {
    id: 'goodbye',
    test: /^((ok|okay) )?(bye+|bye bye|goodbye|good bye|see you( later| soon)?|see ya|take care|good night|gn|cya|alvida)$/,
    replies: () => [
      'Goodbye! Take care and stay safe out there.',
      'See you later! Breathe easy.',
      'Take care! Come back anytime.'
    ]
  },
  {
    id: 'how_are_you',
    test: /^(how are you( doing| today)?|how r u|how do you do|whats up|sup|hows it going)$/,
    replies: () => [
      'I’m doing well, thanks for asking! How can I help you today?',
      'All good here! What would you like to know?'
    ]
  },
  {
    id: 'identity',
    test: /^(who are you|what are you|what can you do|what do you do|what can i ask you|help|help me|how can you help( me)?)$/,
    replies: () => [
      'I’m BreatheWise AI, an assistant built into the BreatheWise air-quality app. I can tell you the current AQI reading, explain what it means, help you plan outdoor activity, masks and indoor air, and chat about other questions too.'
    ]
  }
];

/** Returns a reply string for pure small talk, or null. */
export function matchSmallTalk(message, userProfile) {
  const n = normalizeText(message);
  if (!n) return null;
  const name = userProfile && typeof userProfile.name === 'string' ? userProfile.name.trim() : '';
  for (const item of SMALL_TALK) {
    if (item.test.test(n)) return { id: item.id, text: pick(item.replies(name)) };
  }
  return null;
}

// ───────────────────────── Intent detection ─────────────────────────

const RE_AIR = /\b(aqi|air quality|air pollution|pollution|smog)\b/;
const RE_WHAT_IS = /\b(what is|what are|what does|explain|meaning of|define)\b.*\b(aqi|pm ?2 ?5|pm ?10|pm|cpcb)\b/;
const RE_MASK = /\b(mask|masks|n95|respirator|ffp2|ffp3)\b/;
const RE_EXERCISE = /\b(exercise|exercising|run|running|jog|jogging|workout|gym|cycling|cycle|walk|walking|sport|sports|yoga)\b/;
const RE_PLAN = /\b(plan|planning|schedule|routine|day)\b/;
const RE_ADVICE = /\b(tips|advice|precaution|precautions|what should i do|protect|protection|high|bad)\b/;
const RE_OUTDOOR = /\b(go out|going out|step out|outside|outdoor|outdoors|commute|commuting|travel|school|safe)\b/;

function isCurrentAqiQuestion(n) {
  if (!RE_AIR.test(n)) return false;
  const wantsAdviceOrExplanation =
    /\b(plan|schedule|routine|should|safe|exercise|run|mask|go out|outside|outdoor|tips|reduce|improve|why|explain|what is aqi|what does|how to|how do)\b/.test(
      n
    );
  if (wantsAdviceOrExplanation) return false;
  return (
    /\b(current|currently|now|right now|today|latest|reading|level|how is|how bad|hows|whats|what is|tell me|show|check)\b/.test(
      n
    ) || /^(aqi|air quality)$/.test(n)
  );
}

/**
 * Replies that never need Gemini: small talk and "what's the current AQI".
 * Returns { text, kind } or null.
 */
export function tryInstantReply(message, aqiContext, userProfile) {
  const talk = matchSmallTalk(message, userProfile);
  if (talk) return { text: talk.text, kind: talk.id };

  const n = normalizeText(message);
  if (isCurrentAqiQuestion(n)) {
    const facts = buildAqiFacts(aqiContext);
    let text = describeReading(facts);
    if (facts.hasAqi && facts.status !== 'demo') text += ` ${facts.band.advice[0]}`;
    if (!facts.hasAqi) text += ' Check the dashboard again in a little while.';
    return { text, kind: 'current_aqi' };
  }
  return null;
}

// ───────────────────────── Basic mode (Gemini unavailable) ─────────────────────────

function engineLines(engineRecs) {
  if (!Array.isArray(engineRecs) || engineRecs.length === 0) return [];
  return engineRecs
    .slice(0, 3)
    .map((r) => {
      const action = r && (r.action || r.title);
      if (!action) return null;
      return r.reason ? `${action} (${r.reason})` : String(action);
    })
    .filter(Boolean);
}

function adviceBlock(facts, focus) {
  const lines = [];
  if (!facts.hasAqi) {
    lines.push(...UNAVAILABLE_ADVICE);
    return lines;
  }
  if (facts.status === 'demo') {
    lines.push('Because this is demo data, I cannot tell you whether it is safe outside right now. For reference, this is the usual guidance at this level:');
  } else if (facts.status === 'stale' || facts.status === 'unverified') {
    lines.push('Lean towards the cautious side:');
  }
  if (focus === 'exercise') lines.push(facts.band.exercise);
  else if (focus === 'mask') lines.push(facts.band.mask);
  else lines.push(...facts.band.advice);
  return lines;
}

const BASIC_INTRO = 'The AI service is unavailable right now, so this is a basic answer based on the current reading.';

const EDUCATION =
  'AQI (Air Quality Index) turns pollutant levels into one number from 0 to 500. On India’s CPCB scale: 0–50 Good, 51–100 Satisfactory, 101–200 Moderate, 201–300 Poor, 301–400 Very Poor, 401–500 Severe. PM2.5 means particles smaller than 2.5 micrometres; they are small enough to get deep into the lungs, which is why they matter most for health.';

/**
 * Grounded reply used when Gemini cannot answer. Uses only the supplied context.
 */
export function buildBasicModeReply(message, aqiContext, engineRecs, userProfile) {
  const talk = matchSmallTalk(message, userProfile);
  if (talk) return talk.text;

  const n = normalizeText(message);
  const facts = buildAqiFacts(aqiContext);

  if (RE_WHAT_IS.test(n)) {
    return `The AI service is unavailable right now, but here is the basic explanation:\n\n${EDUCATION}`;
  }

  let focus = null;
  if (RE_MASK.test(n)) focus = 'mask';
  else if (RE_EXERCISE.test(n)) focus = 'exercise';
  else if ((RE_PLAN.test(n) && /\b(aqi|air|smog|pollution|high|bad|poor|severe)\b/.test(n)) || RE_OUTDOOR.test(n)) focus = 'general';
  else if (RE_AIR.test(n) && RE_ADVICE.test(n)) focus = 'general';

  if (!focus) {
    return `I can’t answer that properly without the AI service, which is unavailable right now. Please try again in a minute.\n\nIn the meantime I can still tell you the current AQI reading and give basic guidance on going outside, exercising, masks, or planning your day around AQI.`;
  }

  const parts = [BASIC_INTRO, describeReading(facts)];
  const advice = adviceBlock(facts, focus);
  parts.push(advice.map((l) => (l.endsWith(':') ? l : `• ${l}`)).join('\n'));

  // Engine recommendations are computed from the same reading, so skip them for demo data.
  const engine = facts.status === 'demo' ? [] : engineLines(engineRecs);
  if (engine.length) parts.push(`BreatheWise recommendations for you:\n${engine.map((l) => `• ${l}`).join('\n')}`);

  parts.push(MEDICAL_NOTE);
  return parts.join('\n\n');
}
