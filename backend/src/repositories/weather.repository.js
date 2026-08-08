// src/repositories/weather.repository.js
// Data-access layer for the Weather module.
//
// Instead of querying our PostgreSQL database, this repository fetches
// real-time weather data from Open-Meteo (https://open-meteo.com/).
//
// Why Open-Meteo?
//   ✅ 100% FREE — no API key, no billing
//   ✅ High-accuracy WMO (World Meteorological Organisation) data
//   ✅ Supports every city in the world via their geocoding API
//   ✅ Returns current weather + 7-day forecast in one request

const prisma = require('../config/database');

// ── Open-Meteo API base URLs ──────────────────────────────────────────────────
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL  = 'https://api.open-meteo.com/v1/forecast';

/**
 * Converts a city name (e.g., "Paris") into latitude & longitude.
 * Uses Open-Meteo's free geocoding API.
 *
 * @param {string} cityName - The city to geocode
 * @returns {{ name, country, lat, lng, timezone }} or throws 404
 */
const geocodeCity = async (cityName) => {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const res  = await fetch(url);

  if (!res.ok) {
    const err = new Error('Geocoding API request failed.');
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();

  // If no results found for the city name, return a clear error
  if (!data.results || data.results.length === 0) {
    const err = new Error(`City "${cityName}" not found. Please check the spelling.`);
    err.statusCode = 404;
    throw err;
  }

  const loc = data.results[0];
  return {
    name:     loc.name,
    country:  loc.country,
    lat:      loc.latitude,
    lng:      loc.longitude,
    timezone: loc.timezone || 'auto',
  };
};

/**
 * Fetches current weather + 7-day forecast from Open-Meteo.
 * All parameters are free-tier — no key required.
 *
 * @param {number} lat      - Latitude
 * @param {number} lng      - Longitude
 * @param {string} timezone - Timezone string (e.g., "Asia/Kolkata")
 * @returns Raw Open-Meteo forecast JSON
 */
const fetchForecast = async (lat, lng, timezone = 'auto') => {
  // We request several weather variables in one API call:
  //   current  → real-time readings (temperature, humidity, wind, weather code)
  //   daily    → next 7 days (max/min temp, rain probability, weather code)
  const params = new URLSearchParams({
    latitude:                     lat,
    longitude:                    lng,
    timezone,
    forecast_days:                7,
    current:                      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,uv_index',
    daily:                        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max',
    wind_speed_unit:              'kmh',
    temperature_unit:             'celsius',
  });

  const url = `${FORECAST_URL}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = new Error('Weather forecast API request failed.');
    err.statusCode = 502;
    throw err;
  }

  return res.json();
};

/**
 * Fetch a trip's destination from our PostgreSQL database via Prisma.
 * Used by the /api/weather/trip/:tripId endpoint.
 *
 * @param {string} tripId - UUID of the trip
 * @param {string} userId - UUID of the logged-in user (for authorization)
 * @returns Trip record with destination field
 */
const findTripDestination = async (tripId, userId) => {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      id:          true,
      title:       true,
      destination: true,
      startDate:   true,
      endDate:     true,
    },
  });
};

module.exports = {
  geocodeCity,
  fetchForecast,
  findTripDestination,
};
