// src/services/weather.service.js
// Axios wrapper functions for the Weather API endpoints with resilient client fallback.

import api from './api';

const WMO_CODES = {
  0:  { label: 'Clear Sky',              emoji: '☀️',  severity: 'good'    },
  1:  { label: 'Mainly Clear',           emoji: '🌤️', severity: 'good'    },
  2:  { label: 'Partly Cloudy',          emoji: '⛅',  severity: 'good'    },
  3:  { label: 'Overcast',               emoji: '☁️',  severity: 'neutral' },
  45: { label: 'Foggy',                  emoji: '🌫️', severity: 'caution' },
  48: { label: 'Freezing Fog',           emoji: '🌫️', severity: 'caution' },
  51: { label: 'Light Drizzle',          emoji: '🌦️', severity: 'caution' },
  53: { label: 'Moderate Drizzle',       emoji: '🌧️', severity: 'caution' },
  55: { label: 'Heavy Drizzle',          emoji: '🌧️', severity: 'caution' },
  61: { label: 'Slight Rain',            emoji: '🌧️', severity: 'caution' },
  63: { label: 'Moderate Rain',          emoji: '🌧️', severity: 'caution' },
  65: { label: 'Heavy Rain',             emoji: '🌧️', severity: 'bad'     },
  71: { label: 'Slight Snowfall',        emoji: '🌨️', severity: 'caution' },
  73: { label: 'Moderate Snowfall',      emoji: '❄️',  severity: 'caution' },
  75: { label: 'Heavy Snowfall',         emoji: '❄️',  severity: 'bad'     },
  80: { label: 'Rain Showers',           emoji: '🌦️', severity: 'caution' },
  81: { label: 'Moderate Showers',       emoji: '🌧️', severity: 'caution' },
  82: { label: 'Violent Showers',        emoji: '⛈️',  severity: 'bad'     },
  95: { label: 'Thunderstorm',           emoji: '⛈️',  severity: 'bad'     },
};

const decodeWmo = (code) => WMO_CODES[code] || { label: 'Clear', emoji: '☀️', severity: 'good' };

const KNOWN_CITIES = {
  'delhi':       { name: 'New Delhi',   state: 'Delhi',           country: 'India', countryCode: 'IN', lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' },
  'new delhi':   { name: 'New Delhi',   state: 'Delhi',           country: 'India', countryCode: 'IN', lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' },
  'goa':         { name: 'Goa',         state: 'Goa',             country: 'India', countryCode: 'IN', lat: 15.2993, lng: 74.1240, timezone: 'Asia/Kolkata' },
  'mumbai':      { name: 'Mumbai',      state: 'Maharashtra',     country: 'India', countryCode: 'IN', lat: 19.0760, lng: 72.8777, timezone: 'Asia/Kolkata' },
  'jaipur':      { name: 'Jaipur',      state: 'Rajasthan',       country: 'India', countryCode: 'IN', lat: 26.9124, lng: 75.7873, timezone: 'Asia/Kolkata' },
  'kerala':      { name: 'Thiruvananthapuram', state: 'Kerala',   country: 'India', countryCode: 'IN', lat: 8.5241,  lng: 76.9366, timezone: 'Asia/Kolkata' },
  'shimla':      { name: 'Shimla',      state: 'Himachal Pradesh',country: 'India', countryCode: 'IN', lat: 31.1048, lng: 77.1734, timezone: 'Asia/Kolkata' },
  'manali':      { name: 'Manali',      state: 'Himachal Pradesh',country: 'India', countryCode: 'IN', lat: 32.2396, lng: 77.1887, timezone: 'Asia/Kolkata' },
  'varanasi':    { name: 'Varanasi',    state: 'Uttar Pradesh',   country: 'India', countryCode: 'IN', lat: 25.3176, lng: 82.9739, timezone: 'Asia/Kolkata' },
  'bengaluru':   { name: 'Bengaluru',   state: 'Karnataka',       country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946, timezone: 'Asia/Kolkata' },
  'bangalore':   { name: 'Bengaluru',   state: 'Karnataka',       country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946, timezone: 'Asia/Kolkata' },
  'kolkata':     { name: 'Kolkata',     state: 'West Bengal',     country: 'India', countryCode: 'IN', lat: 22.5726, lng: 88.3639, timezone: 'Asia/Kolkata' },
  'hyderabad':   { name: 'Hyderabad',   state: 'Telangana',       country: 'India', countryCode: 'IN', lat: 17.3850, lng: 78.4867, timezone: 'Asia/Kolkata' },
  'chennai':     { name: 'Chennai',     state: 'Tamil Nadu',      country: 'India', countryCode: 'IN', lat: 13.0827, lng: 80.2707, timezone: 'Asia/Kolkata' },
  'pune':        { name: 'Pune',        state: 'Maharashtra',     country: 'India', countryCode: 'IN', lat: 18.5204, lng: 73.8567, timezone: 'Asia/Kolkata' },
  'agra':        { name: 'Agra',        state: 'Uttar Pradesh',   country: 'India', countryCode: 'IN', lat: 27.1767, lng: 78.0081, timezone: 'Asia/Kolkata' },
  'amritsar':    { name: 'Amritsar',    state: 'Punjab',          country: 'India', countryCode: 'IN', lat: 31.6340, lng: 74.8723, timezone: 'Asia/Kolkata' },
  'leh':         { name: 'Leh',         state: 'Ladakh',          country: 'India', countryCode: 'IN', lat: 34.1526, lng: 77.5771, timezone: 'Asia/Kolkata' },
  'paris':       { name: 'Paris',       state: 'Île-de-France',   country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522,  timezone: 'Europe/Paris' },
  'dubai':       { name: 'Dubai',       state: 'Dubai',           country: 'UAE',   countryCode: 'AE', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  'tokyo':       { name: 'Tokyo',       state: 'Tokyo',           country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  'london':      { name: 'London',      state: 'England',         country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  'singapore':   { name: 'Singapore',   state: 'Singapore',       country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
  'bali':        { name: 'Denpasar',    state: 'Bali',            country: 'Indonesia', countryCode: 'ID', lat: -8.6705, lng: 115.2126, timezone: 'Asia/Makassar' },
  'bangkok':     { name: 'Bangkok',     state: 'Bangkok',         country: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok' },
  'sydney':      { name: 'Sydney',      state: 'New South Wales', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
};

/**
 * Direct client-side fetch from the user's browser.
 * Used as a fallback if Render's backend IP encounters external 429 rate limits.
 */
const fetchClientDirectWeather = async (city) => {
  const key = city.trim().toLowerCase();
  let best = KNOWN_CITIES[key];

  if (!best) {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
      throw new Error(`City "${city}" not found.`);
    }
    // Prioritize results with high population or country matches
    const sorted = [...geoData.results].sort((a, b) => (b.population || 0) - (a.population || 0));
    const r = sorted[0];
    best = {
      name:        r.name,
      state:       r.admin1 || null,
      country:     r.country,
      countryCode: r.country_code,
      lat:         r.latitude,
      lng:         r.longitude,
      timezone:    r.timezone || 'auto',
      population:  r.population || 0,
    };
  }

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${best.latitude}&longitude=${best.longitude}&timezone=auto&forecast_days=7&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max&wind_speed_unit=kmh&temperature_unit=celsius`
  );
  const raw = await forecastRes.json();
  const cur = raw.current;

  return {
    location: {
      name:        best.name,
      state:       best.admin1 || null,
      country:     best.country,
      countryCode: best.country_code,
      lat:         best.latitude,
      lng:         best.longitude,
      timezone:    best.timezone || 'auto',
      population:  best.population || 0,
    },
    current: {
      temperature:   Math.round(cur.temperature_2m),
      feelsLike:     Math.round(cur.apparent_temperature),
      humidity:      cur.relative_humidity_2m,
      windSpeed:     Math.round(cur.wind_speed_10m),
      precipitation: cur.precipitation,
      uvIndex:       raw.daily?.uv_index_max?.[0] ?? null,
      weather:       decodeWmo(cur.weather_code),
    },
    forecast: (raw.daily?.time || []).map((date, i) => ({
      date,
      day:          new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
      weather:      decodeWmo(raw.daily.weather_code[i]),
      tempMax:      Math.round(raw.daily.temperature_2m_max[i]),
      tempMin:      Math.round(raw.daily.temperature_2m_min[i]),
      rainChance:   raw.daily.precipitation_probability_max[i] ?? 0,
      maxWindSpeed: Math.round(raw.daily.wind_speed_10m_max[i]),
      uvIndex:      raw.daily.uv_index_max[i],
    })),
    advice: [
      Math.round(cur.temperature_2m) >= 28
        ? '☀️ Warm weather — light cotton clothes recommended.'
        : '🌤️ Pleasant weather — ideal for outdoor sightseeing!',
      '💧 High humidity — stay hydrated during your travels.',
    ],
    fetchedAt: new Date().toISOString(),
  };
};

/** Fetch current weather + 7-day forecast for any city */
export const getCityWeather = async (city) => {
  try {
    return await api.get(`/weather/city/${encodeURIComponent(city)}`);
  } catch (err) {
    if (!err.response || err.response.status === 429 || err.response.status >= 500) {
      console.warn('[weather.service] Backend rate limited or error, using direct browser fallback...');
      const fallbackData = await fetchClientDirectWeather(city);
      return { data: { success: true, data: fallbackData } };
    }
    throw err;
  }
};

/** Fetch weather for the destination of a saved trip */
export const getTripWeather = (tripId) =>
  api.get(`/weather/trip/${tripId}`);
