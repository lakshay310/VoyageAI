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

/**
 * Direct client-side fetch from the user's browser.
 * Used as a fallback if Render's backend IP encounters external 429 rate limits.
 */
const fetchClientDirectWeather = async (city) => {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const geoData = await geoRes.json();
  if (!geoData.results || !geoData.results.length) {
    throw new Error(`City "${city}" not found.`);
  }
  const best = geoData.results[0];

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
