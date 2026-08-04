// src/services/ai.service.js
// The core AI logic — sends user's trip preferences to Google Gemini
// and returns a rich travel itinerary with hotel suggestions, restaurant picks,
// and all costs shown in BOTH local currency AND Indian Rupees.

const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY } = require('../config/env');

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ── Currency & Country Mapping ────────────────────────────────────────────────
// Maps destination keywords → { currency code, symbol, approx INR rate, country }
// Rates are approximate mid-market values for display purposes.
// Example: 1 AED ≈ ₹23, so if budget is ₹80,000 → ≈ 3,478 AED

const DESTINATION_CURRENCY_MAP = [
  // ── Middle East ──────────────────────────────────────────────────────────────
  { keywords: ['dubai', 'abu dhabi', 'sharjah', 'uae', 'emirates'], code: 'AED', symbol: 'AED', rate: 23.0,  country: 'UAE' },
  { keywords: ['saudi', 'riyadh', 'jeddah', 'ksa'],                 code: 'SAR', symbol: 'SAR', rate: 22.4,  country: 'Saudi Arabia' },
  { keywords: ['qatar', 'doha'],                                     code: 'QAR', symbol: 'QAR', rate: 23.0,  country: 'Qatar' },
  { keywords: ['bahrain'],                                           code: 'BHD', symbol: 'BHD', rate: 222.0, country: 'Bahrain' },
  { keywords: ['oman', 'muscat'],                                    code: 'OMR', symbol: 'OMR', rate: 218.0, country: 'Oman' },
  { keywords: ['kuwait'],                                            code: 'KWD', symbol: 'KWD', rate: 272.0, country: 'Kuwait' },
  { keywords: ['jordan', 'amman'],                                   code: 'JOD', symbol: 'JOD', rate: 118.0, country: 'Jordan' },
  { keywords: ['turkey', 'istanbul', 'ankara', 'antalya'],          code: 'TRY', symbol: '₺',   rate: 2.6,   country: 'Turkey' },

  // ── Southeast Asia ────────────────────────────────────────────────────────────
  { keywords: ['thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya'], code: 'THB', symbol: '฿', rate: 2.4, country: 'Thailand' },
  { keywords: ['bali', 'jakarta', 'indonesia', 'yogyakarta', 'lombok'],   code: 'IDR', symbol: 'Rp', rate: 0.0052, country: 'Indonesia' },
  { keywords: ['singapore'],                                         code: 'SGD', symbol: 'S$',  rate: 62.0,  country: 'Singapore' },
  { keywords: ['malaysia', 'kuala lumpur', 'kl', 'penang', 'langkawi'], code: 'MYR', symbol: 'RM', rate: 18.5, country: 'Malaysia' },
  { keywords: ['vietnam', 'hanoi', 'ho chi minh', 'da nang', 'hoi an'], code: 'VND', symbol: '₫', rate: 0.0034, country: 'Vietnam' },
  { keywords: ['philippines', 'manila', 'boracay', 'cebu', 'palawan'], code: 'PHP', symbol: '₱', rate: 1.5, country: 'Philippines' },
  { keywords: ['cambodia', 'siem reap', 'phnom penh', 'angkor'],   code: 'USD', symbol: '$',   rate: 84.0,  country: 'Cambodia (USD used)' },
  { keywords: ['myanmar', 'yangon', 'bagan'],                       code: 'MMK', symbol: 'K',   rate: 0.04,  country: 'Myanmar' },
  { keywords: ['laos', 'vientiane', 'luang prabang'],               code: 'LAK', symbol: '₭',   rate: 0.004, country: 'Laos' },

  // ── Europe ────────────────────────────────────────────────────────────────────
  { keywords: ['paris', 'france', 'nice', 'lyon', 'bordeaux', 'marseille'], code: 'EUR', symbol: '€', rate: 92.0, country: 'France' },
  { keywords: ['london', 'uk', 'england', 'scotland', 'wales', 'britain', 'manchester', 'edinburgh'], code: 'GBP', symbol: '£', rate: 108.0, country: 'United Kingdom' },
  { keywords: ['germany', 'berlin', 'munich', 'frankfurt', 'hamburg', 'cologne'], code: 'EUR', symbol: '€', rate: 92.0, country: 'Germany' },
  { keywords: ['italy', 'rome', 'milan', 'venice', 'florence', 'naples'], code: 'EUR', symbol: '€', rate: 92.0, country: 'Italy' },
  { keywords: ['spain', 'madrid', 'barcelona', 'seville', 'valencia', 'ibiza'], code: 'EUR', symbol: '€', rate: 92.0, country: 'Spain' },
  { keywords: ['netherlands', 'amsterdam', 'rotterdam'],            code: 'EUR', symbol: '€',   rate: 92.0, country: 'Netherlands' },
  { keywords: ['switzerland', 'zurich', 'geneva', 'interlaken', 'bern'], code: 'CHF', symbol: 'CHF', rate: 96.0, country: 'Switzerland' },
  { keywords: ['austria', 'vienna', 'salzburg', 'innsbruck'],       code: 'EUR', symbol: '€',   rate: 92.0, country: 'Austria' },
  { keywords: ['czech', 'prague'],                                   code: 'CZK', symbol: 'Kč',  rate: 3.8,  country: 'Czech Republic' },
  { keywords: ['hungary', 'budapest'],                              code: 'HUF', symbol: 'Ft',  rate: 0.23, country: 'Hungary' },
  { keywords: ['poland', 'warsaw', 'krakow'],                       code: 'PLN', symbol: 'zł',  rate: 21.0, country: 'Poland' },
  { keywords: ['portugal', 'lisbon', 'porto', 'algarve'],           code: 'EUR', symbol: '€',   rate: 92.0, country: 'Portugal' },
  { keywords: ['greece', 'athens', 'santorini', 'mykonos', 'crete'], code: 'EUR', symbol: '€',  rate: 92.0, country: 'Greece' },
  { keywords: ['sweden', 'stockholm'],                              code: 'SEK', symbol: 'kr',  rate: 8.2,  country: 'Sweden' },
  { keywords: ['norway', 'oslo', 'bergen'],                         code: 'NOK', symbol: 'kr',  rate: 7.8,  country: 'Norway' },
  { keywords: ['denmark', 'copenhagen'],                            code: 'DKK', symbol: 'kr',  rate: 12.3, country: 'Denmark' },
  { keywords: ['croatia', 'dubrovnik', 'split', 'zagreb'],         code: 'EUR', symbol: '€',   rate: 92.0, country: 'Croatia' },

  // ── East Asia ─────────────────────────────────────────────────────────────────
  { keywords: ['japan', 'tokyo', 'osaka', 'kyoto', 'hiroshima', 'nara', 'sapporo', 'fukuoka'], code: 'JPY', symbol: '¥', rate: 0.56, country: 'Japan' },
  { keywords: ['south korea', 'seoul', 'busan', 'jeju', 'korea'], code: 'KRW', symbol: '₩', rate: 0.062, country: 'South Korea' },
  { keywords: ['china', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'xian'], code: 'CNY', symbol: '¥', rate: 11.6, country: 'China' },
  { keywords: ['taiwan', 'taipei'],                                 code: 'TWD', symbol: 'NT$', rate: 2.7,  country: 'Taiwan' },
  { keywords: ['hong kong'],                                        code: 'HKD', symbol: 'HK$', rate: 10.8, country: 'Hong Kong' },

  // ── Oceania ───────────────────────────────────────────────────────────────────
  { keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'gold coast', 'cairns'], code: 'AUD', symbol: 'A$', rate: 54.0, country: 'Australia' },
  { keywords: ['new zealand', 'auckland', 'queenstown', 'christchurch'], code: 'NZD', symbol: 'NZ$', rate: 50.0, country: 'New Zealand' },

  // ── Americas ──────────────────────────────────────────────────────────────────
  { keywords: ['usa', 'united states', 'new york', 'los angeles', 'chicago', 'miami', 'las vegas', 'san francisco', 'washington', 'orlando'], code: 'USD', symbol: '$', rate: 84.0, country: 'USA' },
  { keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary'], code: 'CAD', symbol: 'C$', rate: 62.0, country: 'Canada' },
  { keywords: ['mexico', 'cancun', 'mexico city', 'playa del carmen', 'tulum'], code: 'MXN', symbol: 'MX$', rate: 4.4, country: 'Mexico' },
  { keywords: ['brazil', 'rio', 'sao paulo'],                       code: 'BRL', symbol: 'R$',  rate: 15.0, country: 'Brazil' },
  { keywords: ['peru', 'lima', 'machu picchu', 'cusco'],            code: 'PEN', symbol: 'S/',  rate: 22.5, country: 'Peru' },

  // ── Africa ────────────────────────────────────────────────────────────────────
  { keywords: ['kenya', 'nairobi', 'mombasa', 'masai mara'],       code: 'KES', symbol: 'KSh', rate: 0.65, country: 'Kenya' },
  { keywords: ['south africa', 'cape town', 'johannesburg', 'durban'], code: 'ZAR', symbol: 'R', rate: 4.5, country: 'South Africa' },
  { keywords: ['egypt', 'cairo', 'luxor', 'hurghada', 'sharm el sheikh'], code: 'EGP', symbol: 'E£', rate: 1.7, country: 'Egypt' },
  { keywords: ['morocco', 'marrakech', 'casablanca', 'fez'],       code: 'MAD', symbol: 'MAD', rate: 8.4, country: 'Morocco' },
  { keywords: ['tanzania', 'zanzibar', 'serengeti'],               code: 'TZS', symbol: 'TSh', rate: 0.032, country: 'Tanzania' },

  // ── South Asia (Non-India) ────────────────────────────────────────────────────
  { keywords: ['nepal', 'kathmandu', 'pokhara', 'everest'],        code: 'NPR', symbol: 'रू', rate: 0.63, country: 'Nepal' },
  { keywords: ['sri lanka', 'colombo', 'kandy', 'galle'],          code: 'LKR', symbol: 'Rs', rate: 0.29, country: 'Sri Lanka' },
  { keywords: ['maldives', 'male'],                                 code: 'MVR', symbol: 'Rf', rate: 5.5, country: 'Maldives' },
  { keywords: ['bhutan', 'thimphu', 'paro'],                       code: 'BTN', symbol: 'Nu', rate: 1.0, country: 'Bhutan' },

  // ── Indian Cities (keep INR) ──────────────────────────────────────────────────
  { keywords: ['goa', 'delhi', 'mumbai', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'jaipur', 'manali', 'shimla', 'agra', 'varanasi', 'kerala', 'udaipur', 'rishikesh', 'darjeeling', 'ladakh', 'leh', 'mysore', 'ooty', 'munnar', 'coorg', 'hampi', 'amritsar', 'jodhpur', 'andaman', 'rajasthan', 'india'], code: 'INR', symbol: '₹', rate: 1.0, country: 'India' },
];

/**
 * Detect the destination's local currency from the destination string.
 * Returns { code, symbol, rate, country } or defaults to USD for unknown destinations.
 *
 * @param {string} destination - Raw destination text from user
 * @returns {{ code: string, symbol: string, rate: number, country: string }}
 */
const detectCurrency = (destination) => {
  const lower = destination.toLowerCase();
  const match = DESTINATION_CURRENCY_MAP.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  );
  // Default to USD if we can't detect (for unknown international destinations)
  return match || { code: 'USD', symbol: '$', rate: 84.0, country: 'International' };
};

/**
 * Convert INR amount to local currency using the rate table.
 * Example: inrToLocal(80000, 23) → 3,478 AED
 */
const inrToLocal = (inr, rate) => Math.round(inr / rate).toLocaleString('en-IN');

/**
 * Build the AI prompt with hotel suggestions, restaurant picks,
 * and all prices in both local currency and INR.
 *
 * @param {object} params - User's trip preferences
 */
const buildPrompt = ({ destination, days, budget, travelStyle, interests }) => {
  const curr = detectCurrency(destination);
  const isIndia = curr.code === 'INR';

  // Convert INR budget → local currency
  const budgetLocal  = Math.round(Number(budget) / curr.rate);
  const budgetInr    = Number(budget);

  // Budget display string
  const budgetLine = isIndia
    ? `- Total Budget: ₹${budgetInr.toLocaleString('en-IN')} (Indian Rupees)`
    : `- Total Budget: ₹${budgetInr.toLocaleString('en-IN')} INR = ${curr.symbol} ${budgetLocal.toLocaleString()} ${curr.code}`;

  // Cost format instruction for AI
  const costFmt = isIndia
    ? '₹[amount]'
    : `${curr.symbol}[amount] ${curr.code} (≈ ₹[INR equivalent])`;

  // Daily budget hint so AI gives realistic per-day estimates
  const dailyBudgetLocal = Math.round(budgetLocal / Number(days));
  const dailyBudgetInr   = Math.round(budgetInr   / Number(days));

  const visaSection = isIndia ? '' : `
**Visa & Entry for Indians:**
- [Visa type required for Indian passport: Visa-on-arrival / e-Visa / Visa required]
- [Approximate cost and processing time]
- [Key documents needed]
`;

  return `
You are an expert travel planner for Indian travellers. Generate a rich, detailed travel itinerary.

**Trip Details:**
- Destination: ${destination}
- Duration: ${days} days
${budgetLine}
- Per Day Budget: ≈ ${isIndia ? '₹' + dailyBudgetInr.toLocaleString('en-IN') : curr.symbol + dailyBudgetLocal.toLocaleString() + ' ' + curr.code + ' (≈ ₹' + dailyBudgetInr.toLocaleString('en-IN') + ')'}
- Travel Style: ${travelStyle}
- Interests: ${interests}

**IMPORTANT INSTRUCTIONS FOR COSTS:**
${isIndia
  ? `All prices MUST be in Indian Rupees (₹). Use format: ₹[amount]`
  : `Show ALL prices in TWO formats:
  1. Local currency first: ${curr.symbol}[amount] ${curr.code}
  2. Then INR equivalent: (≈ ₹[amount])
  Example: ${curr.symbol}50 ${curr.code} (≈ ₹${Math.round(50 * curr.rate)})
  Conversion rate: 1 ${curr.code} = ₹${curr.rate}`}

---

Please provide the following complete itinerary:

## 🏨 RECOMMENDED HOTELS IN ${destination.toUpperCase()}

Provide 3 hotel recommendations for each budget level:

**Budget Hotels (${isIndia ? '₹1,000-₹3,000/night' : curr.symbol + Math.round(1500/curr.rate) + '-' + curr.symbol + Math.round(5000/curr.rate) + '/night'}):**
- [Hotel Name] | Location | Price/night | Why recommended

**Mid-Range Hotels (${isIndia ? '₹3,000-₹10,000/night' : curr.symbol + Math.round(5000/curr.rate) + '-' + curr.symbol + Math.round(15000/curr.rate) + '/night'}):**
- [Hotel Name] | Location | Price/night | Why recommended

**Luxury Hotels (${isIndia ? '₹10,000+/night' : curr.symbol + Math.round(15000/curr.rate) + '+/night'}):**
- [Hotel Name] | Location | Price/night | Why recommended

---

## 🍽️ MUST-TRY RESTAURANTS & FOOD IN ${destination.toUpperCase()}

**Breakfast Spots:**
- [Restaurant Name] | Dish to try | Price | Area/neighbourhood

**Lunch Spots:**
- [Restaurant Name] | Dish to try | Price | Area/neighbourhood

**Dinner Restaurants:**
- [Restaurant Name] | Cuisine & signature dish | Price range per person | Area

**Street Food & Local Snacks (Budget-Friendly):**
- [Food item] | Where to find it | Price

**Indian / Vegetarian-Friendly Options:**
- [Restaurant Name] | What they serve | Price

---

## 📅 DAY-BY-DAY ITINERARY

For each day use this structure:

**Day [N]: [Theme]**
- 🌅 Morning: [Activity + location] — Cost: ${costFmt}
- ☀️ Afternoon: [Activity + location] — Cost: ${costFmt}
- 🌙 Evening: [Activity or restaurant recommendation] — Cost: ${costFmt}
- 🍽️ Today's Meals: [Specific breakfast/lunch/dinner spots with prices in ${costFmt}]
- 💰 Estimated Day Total: ${costFmt}

---

## 💰 BUDGET BREAKDOWN (Full Trip — ${days} Days)

| Category | ${isIndia ? '₹ Amount' : curr.code + ' Amount'} | ${isIndia ? '' : '≈ ₹ INR'} |
|---|---|---|
| Accommodation | [amount] | ${isIndia ? '' : '[INR]'} |
| Food & Restaurants | [amount] | ${isIndia ? '' : '[INR]'} |
| Activities & Attractions | [amount] | ${isIndia ? '' : '[INR]'} |
| Local Transport | [amount] | ${isIndia ? '' : '[INR]'} |
| Shopping & Souvenirs | [amount] | ${isIndia ? '' : '[INR]'} |
| Miscellaneous | [amount] | ${isIndia ? '' : '[INR]'} |
| **TOTAL** | **[total]** | ${isIndia ? '' : '**[INR total]**'} |

---
${visaSection}
## ✈️ GETTING THERE (From India)
- Best airlines and approximate flight costs from Delhi/Mumbai
- Recommended booking window (how many days in advance)

## 💡 PRACTICAL TIPS FOR INDIAN TRAVELLERS IN ${destination.toUpperCase()}
- Power plug type and voltage
- Best SIM card / connectivity option
- Currency exchange tips ${isIndia ? '' : '(where to exchange INR to ' + curr.code + ', avoid airport exchange)'}
- Cultural etiquette and dress code
- Safety tips and areas to avoid
- Best apps to use (maps, taxi, food delivery, translation)
${isIndia ? '' : `
## 💱 QUICK CURRENCY REFERENCE FOR INDIANS
- 1 ${curr.code} = ₹${curr.rate} (approx.)
- ₹1,000 = ${curr.symbol}${inrToLocal(1000, curr.rate)} ${curr.code}
- ₹5,000 = ${curr.symbol}${inrToLocal(5000, curr.rate)} ${curr.code}
- ₹10,000 = ${curr.symbol}${inrToLocal(10000, curr.rate)} ${curr.code}
- ₹50,000 = ${curr.symbol}${inrToLocal(50000, curr.rate)} ${curr.code}
- Your total budget: ₹${budgetInr.toLocaleString('en-IN')} = ${curr.symbol}${budgetLocal.toLocaleString()} ${curr.code}
`}
**Best Time to Visit:** [month range with weather information]
`.trim();
};

/**
 * Generate a travel itinerary using the Gemini AI model.
 *
 * @param {object} tripParams - User inputs from the frontend form
 * @returns {{ itinerary: string, currency: object }} - The generated text + currency info
 */
const generateItinerary = async (tripParams) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const error = new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.');
    error.statusCode = 503;
    throw error;
  }

  const prompt = buildPrompt(tripParams);

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
  });

  // Also return currency info so the frontend can show a conversion banner
  const currency = detectCurrency(tripParams.destination);
  const budgetLocal = Math.round(Number(tripParams.budget) / currency.rate);

  return {
    itinerary: response.text,
    currency: {
      ...currency,
      budgetINR:   Number(tripParams.budget),
      budgetLocal, // budget converted to local currency
    },
  };
};

/**
 * Chat with the AI travel assistant.
 *
 * Sends a user message + the full conversation history to Gemini.
 * Gemini uses the history to understand context from previous turns.
 *
 * @param {string} message   - The user's latest message
 * @param {Array}  history   - Previous turns: [{ role: 'user'|'model', text: string }, ...]
 * @returns {string}         - The AI's reply text
 */
const chatWithBot = async (message, history = []) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const error = new Error('Gemini API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  // Build the current date/time string in IST (India Standard Time, UTC+5:30).
  // We inject this into the system prompt so Gemini always knows the real date.
  // Without this, Gemini guesses based on its training data (wrong month/season).
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5h 30m
  const ist = new Date(now.getTime() + istOffset);

  const dayName   = ist.toLocaleDateString('en-IN', { weekday: 'long',  timeZone: 'Asia/Kolkata' });
  const monthName = ist.toLocaleDateString('en-IN', { month: 'long',   timeZone: 'Asia/Kolkata' });
  const dateStr   = ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr   = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

  // System instruction: sets personality, scope, AND the real current date.
  // Gemini will use this to answer time-sensitive questions correctly —
  // "this time of year", "next month", "is it a good season to visit X?" etc.
  const systemInstruction = `You are VoyageAI, a friendly and knowledgeable travel assistant for Indian travellers.

CURRENT DATE & TIME (use this for all time-sensitive answers):
- Today is: ${dayName}, ${dateStr}
- Current time (IST): ${timeStr}
- Current month: ${monthName}
Use this date whenever the user asks about "this month", "this time of year", "current season", "next month", upcoming festivals, or travel weather.

You help users with:
- Trip planning, itinerary ideas, and destination recommendations
- Budget estimates in Indian Rupees (₹) and local currency
- Hotel and restaurant suggestions
- Visa, transport, and travel tips
- Flight advice and best booking strategies
- Safety tips, cultural etiquette, and packing advice

Keep replies concise (2-4 short paragraphs max), friendly, and use emojis occasionally.
If asked something unrelated to travel, politely redirect to travel topics.
Always mention costs in ₹ when giving Indian traveller-specific advice.`;


  // Build the conversation turns in Gemini's expected format:
  // Each turn is { role: 'user' | 'model', parts: [{ text: '...' }] }
  // We prepend the system instruction as the first user-model exchange
  // so the model understands its role from the very start.
  const systemTurn = [
    { role: 'user',  parts: [{ text: 'Who are you and what can you help me with?' }] },
    { role: 'model', parts: [{ text: `I'm VoyageAI, your personal travel assistant for Indian travellers! 🌍✈️\n\nI can help you with trip planning, budget estimates, hotel & restaurant picks, visa info, flight tips, and much more. Just ask me anything about travel!` }] },
  ];

  // Convert our simple { role, text } history into Gemini's { role, parts } format
  const historyTurns = history.map((turn) => ({
    role:  turn.role,
    parts: [{ text: turn.text }],
  }));

  // The new user message goes last
  const newUserTurn = { role: 'user', parts: [{ text: message }] };

  // All contents = system primer + prior conversation + latest message
  const contents = [...systemTurn, ...historyTurns, newUserTurn];

  const response = await ai.models.generateContent({
    model:  'gemini-3.6-flash',
    config: { systemInstruction },  // Gemini system instruction for personality
    contents,
  });

  return response.text;
};

module.exports = { generateItinerary, detectCurrency, chatWithBot };
