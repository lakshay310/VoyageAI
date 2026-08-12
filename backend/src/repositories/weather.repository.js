// src/repositories/weather.repository.js
// Data-access layer for the Weather module.
//
// Fetches real-time weather data from Open-Meteo (https://open-meteo.com/).
// Open-Meteo is 100% FREE — no API key, no billing, unlimited calls.
//
// IMPORTANT: The Open-Meteo geocoding API sometimes returns wrong cities
// for Indian state names (e.g., "Kerala" returns Finland villages).
// Fix: We maintain a lookup table for known Indian/popular destinations
// and fall back to scored geocoding for everything else.

const prisma = require('../config/database');

// ── Open-Meteo API base URLs ──────────────────────────────────────────────────
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL  = 'https://api.open-meteo.com/v1/forecast';

// ── Known city coordinates lookup table ──────────────────────────────────────
// This prevents wrong geocoding for popular Indian & international destinations.
// When a search matches this table exactly (case-insensitive), we skip the
// geocoding API entirely and use these known-good coordinates.
const KNOWN_CITIES = {
  // ── India ──────────────────────────────────────────────────────────────────
  'goa':         { name: 'Goa',         state: 'Goa',             country: 'India',         countryCode: 'IN', lat: 15.2993,  lng: 74.1240,  timezone: 'Asia/Kolkata'     },
  'kerala':      { name: 'Thiruvananthapuram', state: 'Kerala',   country: 'India',         countryCode: 'IN', lat: 8.5241,   lng: 76.9366,  timezone: 'Asia/Kolkata'     },
  'delhi':       { name: 'New Delhi',   state: 'Delhi',           country: 'India',         countryCode: 'IN', lat: 28.6139,  lng: 77.2090,  timezone: 'Asia/Kolkata'     },
  'new delhi':   { name: 'New Delhi',   state: 'Delhi',           country: 'India',         countryCode: 'IN', lat: 28.6139,  lng: 77.2090,  timezone: 'Asia/Kolkata'     },
  'mumbai':      { name: 'Mumbai',      state: 'Maharashtra',     country: 'India',         countryCode: 'IN', lat: 19.0760,  lng: 72.8777,  timezone: 'Asia/Kolkata'     },
  'bengaluru':   { name: 'Bengaluru',   state: 'Karnataka',       country: 'India',         countryCode: 'IN', lat: 12.9716,  lng: 77.5946,  timezone: 'Asia/Kolkata'     },
  'bangalore':   { name: 'Bengaluru',   state: 'Karnataka',       country: 'India',         countryCode: 'IN', lat: 12.9716,  lng: 77.5946,  timezone: 'Asia/Kolkata'     },
  'jaipur':      { name: 'Jaipur',      state: 'Rajasthan',       country: 'India',         countryCode: 'IN', lat: 26.9124,  lng: 75.7873,  timezone: 'Asia/Kolkata'     },
  'rajasthan':   { name: 'Jaipur',      state: 'Rajasthan',       country: 'India',         countryCode: 'IN', lat: 26.9124,  lng: 75.7873,  timezone: 'Asia/Kolkata'     },
  'shimla':      { name: 'Shimla',      state: 'Himachal Pradesh',country: 'India',         countryCode: 'IN', lat: 31.1048,  lng: 77.1734,  timezone: 'Asia/Kolkata'     },
  'manali':      { name: 'Manali',      state: 'Himachal Pradesh',country: 'India',         countryCode: 'IN', lat: 32.2396,  lng: 77.1887,  timezone: 'Asia/Kolkata'     },
  'varanasi':    { name: 'Varanasi',    state: 'Uttar Pradesh',   country: 'India',         countryCode: 'IN', lat: 25.3176,  lng: 82.9739,  timezone: 'Asia/Kolkata'     },
  'udaipur':     { name: 'Udaipur',     state: 'Rajasthan',       country: 'India',         countryCode: 'IN', lat: 24.5854,  lng: 73.7125,  timezone: 'Asia/Kolkata'     },
  'kolkata':     { name: 'Kolkata',     state: 'West Bengal',     country: 'India',         countryCode: 'IN', lat: 22.5726,  lng: 88.3639,  timezone: 'Asia/Kolkata'     },
  'hyderabad':   { name: 'Hyderabad',   state: 'Telangana',       country: 'India',         countryCode: 'IN', lat: 17.3850,  lng: 78.4867,  timezone: 'Asia/Kolkata'     },
  'chennai':     { name: 'Chennai',     state: 'Tamil Nadu',      country: 'India',         countryCode: 'IN', lat: 13.0827,  lng: 80.2707,  timezone: 'Asia/Kolkata'     },
  'pune':        { name: 'Pune',        state: 'Maharashtra',     country: 'India',         countryCode: 'IN', lat: 18.5204,  lng: 73.8567,  timezone: 'Asia/Kolkata'     },
  'agra':        { name: 'Agra',        state: 'Uttar Pradesh',   country: 'India',         countryCode: 'IN', lat: 27.1767,  lng: 78.0081,  timezone: 'Asia/Kolkata'     },
  'amritsar':    { name: 'Amritsar',    state: 'Punjab',          country: 'India',         countryCode: 'IN', lat: 31.6340,  lng: 74.8723,  timezone: 'Asia/Kolkata'     },
  'leh':         { name: 'Leh',         state: 'Ladakh',          country: 'India',         countryCode: 'IN', lat: 34.1526,  lng: 77.5771,  timezone: 'Asia/Kolkata'     },
  'ladakh':      { name: 'Leh',         state: 'Ladakh',          country: 'India',         countryCode: 'IN', lat: 34.1526,  lng: 77.5771,  timezone: 'Asia/Kolkata'     },
  'rishikesh':   { name: 'Rishikesh',   state: 'Uttarakhand',     country: 'India',         countryCode: 'IN', lat: 30.0869,  lng: 78.2676,  timezone: 'Asia/Kolkata'     },
  'darjeeling':  { name: 'Darjeeling',  state: 'West Bengal',     country: 'India',         countryCode: 'IN', lat: 27.0410,  lng: 88.2663,  timezone: 'Asia/Kolkata'     },
  // ── International ──────────────────────────────────────────────────────────
  'paris':       { name: 'Paris',       state: 'Île-de-France',   country: 'France',        countryCode: 'FR', lat: 48.8566,  lng: 2.3522,   timezone: 'Europe/Paris'      },
  'dubai':       { name: 'Dubai',       state: 'Dubai',           country: 'UAE',           countryCode: 'AE', lat: 25.2048,  lng: 55.2708,  timezone: 'Asia/Dubai'        },
  'tokyo':       { name: 'Tokyo',       state: 'Tokyo',           country: 'Japan',         countryCode: 'JP', lat: 35.6762,  lng: 139.6503, timezone: 'Asia/Tokyo'        },
  'london':      { name: 'London',      state: 'England',         country: 'United Kingdom',countryCode: 'GB', lat: 51.5074,  lng: -0.1278,  timezone: 'Europe/London'     },
  'singapore':   { name: 'Singapore',   state: 'Singapore',       country: 'Singapore',     countryCode: 'SG', lat: 1.3521,   lng: 103.8198, timezone: 'Asia/Singapore'    },
  'bali':        { name: 'Denpasar',    state: 'Bali',            country: 'Indonesia',     countryCode: 'ID', lat: -8.6705,  lng: 115.2126, timezone: 'Asia/Makassar'     },
  'bangkok':     { name: 'Bangkok',     state: 'Bangkok',         country: 'Thailand',      countryCode: 'TH', lat: 13.7563,  lng: 100.5018, timezone: 'Asia/Bangkok'      },
  'rome':        { name: 'Rome',        state: 'Lazio',           country: 'Italy',         countryCode: 'IT', lat: 41.9028,  lng: 12.4964,  timezone: 'Europe/Rome'       },
  'new york':    { name: 'New York City',state: 'New York',       country: 'United States', countryCode: 'US', lat: 40.7128,  lng: -74.0060, timezone: 'America/New_York'  },
  'sydney':      { name: 'Sydney',      state: 'New South Wales', country: 'Australia',     countryCode: 'AU', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney'  },
  'new york city':{ name:'New York City',state:'New York',        country: 'United States', countryCode: 'US', lat: 40.7128,  lng: -74.0060, timezone: 'America/New_York'  },
  'california':  { name: 'Los Angeles', state: 'California',      country: 'United States', countryCode: 'US', lat: 34.0522,  lng: -118.2437,timezone: 'America/Los_Angeles'},
  'los angeles': { name: 'Los Angeles', state: 'California',      country: 'United States', countryCode: 'US', lat: 34.0522,  lng: -118.2437,timezone: 'America/Los_Angeles'},
  'bavaria':     { name: 'Munich',      state: 'Bavaria',         country: 'Germany',       countryCode: 'DE', lat: 48.1351,  lng: 11.5820,  timezone: 'Europe/Berlin'     },
  'munich':      { name: 'Munich',      state: 'Bavaria',         country: 'Germany',       countryCode: 'DE', lat: 48.1351,  lng: 11.5820,  timezone: 'Europe/Berlin'     },
  'amsterdam':   { name: 'Amsterdam',   state: 'North Holland',   country: 'Netherlands',   countryCode: 'NL', lat: 52.3676,  lng: 4.9041,   timezone: 'Europe/Amsterdam'  },
  'barcelona':   { name: 'Barcelona',   state: 'Catalonia',       country: 'Spain',         countryCode: 'ES', lat: 41.3851,  lng: 2.1734,   timezone: 'Europe/Madrid'     },
  'berlin':      { name: 'Berlin',      state: 'Berlin',          country: 'Germany',       countryCode: 'DE', lat: 52.5200,  lng: 13.4050,  timezone: 'Europe/Berlin'     },
  'toronto':     { name: 'Toronto',     state: 'Ontario',         country: 'Canada',        countryCode: 'CA', lat: 43.6532,  lng: -79.3832, timezone: 'America/Toronto'   },
  'phuket':      { name: 'Phuket',      state: 'Phuket',          country: 'Thailand',      countryCode: 'TH', lat: 7.8804,   lng: 98.3923,  timezone: 'Asia/Bangkok'      },
  'maldives':    { name: 'Malé',        state: 'Kaafu Atoll',     country: 'Maldives',      countryCode: 'MV', lat: 4.1755,   lng: 73.5093,  timezone: 'Indian/Maldives'   },
};

// ── Feature code priority (fallback for unknown cities) ───────────────────────
const FEATURE_CODE_RANK = {
  PPLC: 10, PPLA: 9, PPLA2: 8, PPLA3: 7, PPLA4: 6, PPL: 5,
  ADM1: 4,  ADM2: 3, ADM3: 2,  PCLI: 1,
};

const scoreResult = (r) => {
  const featureScore    = FEATURE_CODE_RANK[r.feature_code] ?? 0;
  const populationScore = r.population ? Math.min(5, Math.log10(r.population)) : 0;
  return featureScore + populationScore;
};

/**
 * Resolves a city name to coordinates + location metadata.
 *
 * Strategy:
 *  1. Check KNOWN_CITIES lookup table first (instant, always correct)
 *  2. Fall back to Open-Meteo geocoding API with smart scoring
 *
 * @param {string} cityName - The city, state, or region name
 * @returns {{ name, state, country, countryCode, lat, lng, timezone }}
 */
const geocodeCity = async (cityName) => {
  const key = cityName.trim().toLowerCase();

  // ── Step 1: Check known cities lookup table ───────────────────────────────
  if (KNOWN_CITIES[key]) {
    return KNOWN_CITIES[key];
  }

  // ── Step 2: Fall back to Open-Meteo Geocoding API ────────────────────────
  // Fetch top 10 candidates and score them to pick the best match
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=10&language=en&format=json`;
  const res  = await fetch(url);

  if (!res.ok) {
    const err = new Error('Geocoding API request failed.');
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    const err = new Error(`City "${cityName}" not found. Try a specific city name (e.g., "Mumbai" instead of "Maharashtra").`);
    err.statusCode = 404;
    throw err;
  }

  // Pick the highest-scoring candidate (most likely to be what the user meant)
  const best = data.results.reduce((top, curr) =>
    scoreResult(curr) > scoreResult(top) ? curr : top,
    data.results[0]
  );

  return {
    name:        best.name,
    state:       best.admin1 || null,
    country:     best.country,
    countryCode: best.country_code,
    lat:         best.latitude,
    lng:         best.longitude,
    timezone:    best.timezone || 'auto',
    population:  best.population || 0,
  };
};

/**
 * Fetches current weather + 7-day forecast from Open-Meteo.
 */
const fetchForecast = async (lat, lng, timezone = 'auto') => {
  const params = new URLSearchParams({
    latitude:         lat,
    longitude:        lng,
    timezone,
    forecast_days:    7,
    current:          'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,uv_index',
    daily:            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max',
    wind_speed_unit:  'kmh',
    temperature_unit: 'celsius',
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);

  if (!res.ok) {
    const err = new Error('Weather forecast API request failed.');
    err.statusCode = 502;
    throw err;
  }

  return res.json();
};

/**
 * Fetch a trip's destination from our PostgreSQL database via Prisma.
 */
const findTripDestination = async (tripId, userId) => {
  return prisma.trip.findFirst({
    where:  { id: tripId, userId },
    select: { id: true, title: true, destination: true, startDate: true, endDate: true },
  });
};

module.exports = {
  geocodeCity,
  fetchForecast,
  findTripDestination,
};
