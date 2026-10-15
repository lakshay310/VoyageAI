// src/services/weather.service.js
// Business logic layer for the Weather module.
//
// Responsibilities:
//   1. Orchestrate geocoding → forecast API calls via the repository
//   2. Map raw WMO weather codes → human-readable labels + emojis
//   3. Format raw numbers into a clean, structured response
//   4. Generate travel advice based on current conditions

const weatherRepository = require('../repositories/weather.repository');

// ── WMO Weather Code → Label + Emoji ─────────────────────────────────────────
// WMO (World Meteorological Organisation) codes are an international standard.
// Open-Meteo uses them. Full list: https://open-meteo.com/en/docs#weathervariables
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
  77: { label: 'Snow Grains',            emoji: '🌨️', severity: 'caution' },
  80: { label: 'Slight Rain Showers',    emoji: '🌦️', severity: 'caution' },
  81: { label: 'Moderate Rain Showers',  emoji: '🌧️', severity: 'caution' },
  82: { label: 'Violent Rain Showers',   emoji: '⛈️',  severity: 'bad'     },
  85: { label: 'Slight Snow Showers',    emoji: '🌨️', severity: 'caution' },
  86: { label: 'Heavy Snow Showers',     emoji: '❄️',  severity: 'bad'     },
  95: { label: 'Thunderstorm',           emoji: '⛈️',  severity: 'bad'     },
  96: { label: 'Thunderstorm w/ Hail',   emoji: '⛈️',  severity: 'bad'     },
  99: { label: 'Thunderstorm w/ Hail',   emoji: '⛈️',  severity: 'bad'     },
};

/**
 * Resolves a WMO code to a weather description object.
 * Falls back to 'Unknown' if the code isn't in our lookup.
 */
const decodeWeatherCode = (code) => {
  return WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️', severity: 'neutral' };
};

/**
 * Generates simple travel advice based on current weather conditions.
 * This is a nice UX touch — shown as tips on the weather page.
 */
const getTravelAdvice = (temp, weatherCode, humidity) => {
  const advice = [];

  if (temp >= 35) advice.push('🥵 Very hot — stay hydrated and wear sunscreen SPF 50+.');
  else if (temp >= 28) advice.push('☀️ Warm weather — light cotton clothes recommended.');
  else if (temp >= 18) advice.push('🌤️ Pleasant weather — ideal for outdoor sightseeing!');
  else if (temp >= 10) advice.push('🧥 Cool weather — carry a light jacket.');
  else advice.push('🧣 Cold weather — layer up with warm clothing.');

  const { severity } = decodeWeatherCode(weatherCode);
  if (severity === 'bad') advice.push('⚠️ Unfavourable weather — avoid outdoor activities today.');
  else if (severity === 'caution') advice.push('🌂 Carry an umbrella — rain or fog expected.');

  if (humidity > 80) advice.push('💧 High humidity — expect it to feel warmer than it is.');

  return advice;
};

/**
 * Formats the raw Open-Meteo daily forecast array into a clean array
 * of day objects — one per day for 7 days.
 */
const formatDailyForecast = (daily) => {
  return daily.time.map((date, i) => ({
    date,
    day:           new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
    weather:       decodeWeatherCode(daily.weather_code[i]),
    tempMax:       Math.round(daily.temperature_2m_max[i]),
    tempMin:       Math.round(daily.temperature_2m_min[i]),
    rainChance:    daily.precipitation_probability_max[i] ?? 0,
    maxWindSpeed:  Math.round(daily.wind_speed_10m_max[i]),
    uvIndex:       daily.uv_index_max[i],
  }));
};

/**
 * Core service function — orchestrates the full weather fetch for a city.
 * Called by the controller for both city search and trip-based weather.
 *
 * Flow: geocode city → fetch forecast → format & return
 *
 * @param {string} cityName - City to fetch weather for
 * @returns Structured weather response object
 */
const getWeatherForCity = async (cityName) => {
  // Step 1: Convert city name → coordinates using Open-Meteo Geocoding API
  const location = await weatherRepository.geocodeCity(cityName);

  // Step 2: Fetch 7-day forecast using those coordinates
  const raw = await weatherRepository.fetchForecast(location.lat, location.lng, location.timezone);

  // Step 3: Format the current weather reading
  const cur = raw.current;
  const currentWeather = {
    temperature:       Math.round(cur.temperature_2m),
    feelsLike:         Math.round(cur.apparent_temperature),
    humidity:          cur.relative_humidity_2m,
    windSpeed:         Math.round(cur.wind_speed_10m),
    precipitation:     cur.precipitation,
    // uv_index is not a 'current' variable in Open-Meteo — use today's daily max instead
    uvIndex:           raw.daily?.uv_index_max?.[0] ?? null,
    weather:           decodeWeatherCode(cur.weather_code),
  };

  // Step 4: Format 7-day forecast
  const forecast = formatDailyForecast(raw.daily);

  // Step 5: Generate travel advice tips
  const advice = getTravelAdvice(currentWeather.temperature, cur.weather_code, currentWeather.humidity);

  return {
    location: {
      name:        location.name,
      state:       location.state,       // e.g., "Goa", "California", "Île-de-France"
      country:     location.country,
      countryCode: location.countryCode, // e.g., "IN", "US", "FR"
      lat:         location.lat,
      lng:         location.lng,
      timezone:    location.timezone,
      population:  location.population,
    },
    current:  currentWeather,
    forecast,
    advice,
    fetchedAt: new Date().toISOString(),
  };
};

/**
 * Fetches weather for a user's saved trip by looking up the trip
 * destination from our database first.
 *
 * @param {string} tripId - UUID of the trip
 * @param {string} userId - UUID of the logged-in user
 */
const getWeatherForTrip = async (tripId, userId) => {
  // Fetch trip from our Prisma DB
  const trip = await weatherRepository.findTripDestination(tripId, userId);

  if (!trip) {
    const err = new Error('Trip not found or you do not have access.');
    err.statusCode = 404;
    throw err;
  }

  // Reuse the city weather logic with the trip's destination
  const weatherData = await getWeatherForCity(trip.destination);

  return {
    trip: {
      id:          trip.id,
      title:       trip.title,
      destination: trip.destination,
      startDate:   trip.startDate,
      endDate:     trip.endDate,
    },
    weather: weatherData,
  };
};

module.exports = {
  getWeatherForCity,
  getWeatherForTrip,
};
