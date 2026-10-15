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

const WEATHER_API_CONDITIONS = {
  1000: { label: 'Sunny / Clear', emoji: '☀️', severity: 'good' },
  1003: { label: 'Partly Cloudy', emoji: '⛅', severity: 'good' },
  1006: { label: 'Cloudy', emoji: '☁️', severity: 'neutral' },
  1009: { label: 'Overcast', emoji: '☁️', severity: 'neutral' },
  1030: { label: 'Mist', emoji: '🌫️', severity: 'caution' },
  1063: { label: 'Patchy Rain', emoji: '🌦️', severity: 'caution' },
  1066: { label: 'Patchy Snow', emoji: '🌨️', severity: 'caution' },
  1069: { label: 'Patchy Sleet', emoji: '🌨️', severity: 'caution' },
  1072: { label: 'Freezing Drizzle', emoji: '🌧️', severity: 'caution' },
  1087: { label: 'Thundery Outbreaks', emoji: '⛈️', severity: 'bad' },
  1114: { label: 'Blowing Snow', emoji: '❄️', severity: 'bad' },
  1117: { label: 'Blizzard', emoji: '❄️', severity: 'bad' },
  1135: { label: 'Fog', emoji: '🌫️', severity: 'caution' },
  1144: { label: 'Freezing Fog', emoji: '🌫️', severity: 'caution' },
  1150: { label: 'Light Drizzle', emoji: '🌦️', severity: 'caution' },
  1153: { label: 'Light Drizzle', emoji: '🌦️', severity: 'caution' },
  1180: { label: 'Patchy Light Rain', emoji: '🌦️', severity: 'caution' },
  1183: { label: 'Light Rain', emoji: '🌧️', severity: 'caution' },
  1186: { label: 'Moderate Rain', emoji: '🌧️', severity: 'caution' },
  1189: { label: 'Moderate Rain', emoji: '🌧️', severity: 'caution' },
  1192: { label: 'Heavy Rain', emoji: '🌧️', severity: 'bad' },
  1195: { label: 'Heavy Rain', emoji: '🌧️', severity: 'bad' },
  1240: { label: 'Light Rain Shower', emoji: '🌦️', severity: 'caution' },
  1243: { label: 'Moderate/Heavy Rain Shower', emoji: '🌧️', severity: 'bad' },
  1246: { label: 'Torrential Rain', emoji: '⛈️', severity: 'bad' },
  1273: { label: 'Thunder with Light Rain', emoji: '⛈️', severity: 'bad' },
  1276: { label: 'Thunder with Heavy Rain', emoji: '⛈️', severity: 'bad' },
  1279: { label: 'Thunder with Snow', emoji: '⛈️', severity: 'bad' },
  1282: { label: 'Thunder with Heavy Snow', emoji: '⛈️', severity: 'bad' },
};

const decodeWeatherApiCondition = (code, text = '') => {
  if (WEATHER_API_CONDITIONS[code]) return WEATHER_API_CONDITIONS[code];
  const lower = (text || '').toLowerCase();
  if (lower.includes('thunder')) return { label: text, emoji: '⛈️', severity: 'bad' };
  if (lower.includes('snow') || lower.includes('blizzard')) return { label: text, emoji: '❄️', severity: 'bad' };
  if (lower.includes('heavy rain') || lower.includes('torrential')) return { label: text, emoji: '🌧️', severity: 'bad' };
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return { label: text, emoji: '🌧️', severity: 'caution' };
  if (lower.includes('fog') || lower.includes('mist')) return { label: text, emoji: '🌫️', severity: 'caution' };
  if (lower.includes('cloud') || lower.includes('overcast')) return { label: text, emoji: '☁️', severity: 'neutral' };
  if (lower.includes('sunny') || lower.includes('clear')) return { label: text, emoji: '☀️', severity: 'good' };
  return { label: text || 'Clear', emoji: '🌤️', severity: 'good' };
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
const getTravelAdvice = (temp, weatherCode, humidity, forcedSeverity = null) => {
  const advice = [];

  if (temp >= 35) advice.push('🥵 Very hot — stay hydrated and wear sunscreen SPF 50+.');
  else if (temp >= 28) advice.push('☀️ Warm weather — light cotton clothes recommended.');
  else if (temp >= 18) advice.push('🌤️ Pleasant weather — ideal for outdoor sightseeing!');
  else if (temp >= 10) advice.push('🧥 Cool weather — carry a light jacket.');
  else advice.push('🧣 Cold weather — layer up with warm clothing.');

  const severity = forcedSeverity || decodeWeatherCode(weatherCode).severity;
  if (severity === 'bad') advice.push('⚠️ Unfavourable weather — avoid outdoor activities today.');
  else if (severity === 'caution') advice.push('🌂 Carry an umbrella — rain or fog expected.');

  if (humidity > 80) advice.push('💧 High humidity — expect it to feel warmer than it is.');

  return advice;
};

/**
 * Formats a WeatherAPI.com response into our unified weather model.
 */
const formatWeatherApiResponse = (data) => {
  const cur = data.current;
  const loc = data.location;
  const weatherDesc = decodeWeatherApiCondition(cur.condition?.code, cur.condition?.text);

  const currentWeather = {
    temperature:       Math.round(cur.temp_c),
    feelsLike:         Math.round(cur.feelslike_c),
    humidity:          cur.humidity,
    windSpeed:         Math.round(cur.wind_kph),
    precipitation:     cur.precip_mm,
    uvIndex:           cur.uv,
    weather:           weatherDesc,
  };

  const forecast = (data.forecast?.forecastday || []).map((item) => {
    const dayDesc = decodeWeatherApiCondition(item.day?.condition?.code, item.day?.condition?.text);
    return {
      date:          item.date,
      day:           new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      weather:       dayDesc,
      tempMax:       Math.round(item.day.maxtemp_c),
      tempMin:       Math.round(item.day.mintemp_c),
      rainChance:    item.day.daily_chance_of_rain ?? 0,
      maxWindSpeed:  Math.round(item.day.maxwind_kph),
      uvIndex:       item.day.uv,
    };
  });

  const advice = getTravelAdvice(currentWeather.temperature, cur.condition?.code || 0, currentWeather.humidity, weatherDesc.severity);

  return {
    location: {
      name:        loc.name,
      state:       loc.region || null,
      country:     loc.country,
      countryCode: loc.country === 'India' ? 'IN' : '',
      lat:         loc.lat,
      lng:         loc.lon,
      timezone:    loc.tz_id || 'auto',
      population:  0,
    },
    current:  currentWeather,
    forecast,
    advice,
    fetchedAt: new Date().toISOString(),
  };
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
 * Flow:
 *   1. Check WeatherAPI.com (if WEATHER_API_KEY is configured)
 *   2. If not configured or failed, fall back to Open-Meteo (geocoding + forecast)
 *
 * @param {string} cityName - City to fetch weather for
 * @returns Structured weather response object
 */
const getWeatherForCity = async (cityName) => {
  // Step 1: Try WeatherAPI.com if API key is provided
  try {
    const weatherApiData = await weatherRepository.fetchFromWeatherApi(cityName);
    if (weatherApiData && weatherApiData.location && weatherApiData.current) {
      return formatWeatherApiResponse(weatherApiData);
    }
  } catch (apiErr) {
    console.warn(`[weather.service] WeatherAPI error, falling back to Open-Meteo:`, apiErr.message);
  }

  // Step 2: Fall back to Open-Meteo (Geocoding + Forecast)
  const location = await weatherRepository.geocodeCity(cityName);
  const raw = await weatherRepository.fetchForecast(location.lat, location.lng, location.timezone);

  const cur = raw.current;
  const currentWeather = {
    temperature:       Math.round(cur.temperature_2m),
    feelsLike:         Math.round(cur.apparent_temperature),
    humidity:          cur.relative_humidity_2m,
    windSpeed:         Math.round(cur.wind_speed_10m),
    precipitation:     cur.precipitation,
    uvIndex:           raw.daily?.uv_index_max?.[0] ?? null,
    weather:           decodeWeatherCode(cur.weather_code),
  };

  const forecast = formatDailyForecast(raw.daily);
  const advice = getTravelAdvice(currentWeather.temperature, cur.weather_code, currentWeather.humidity);

  return {
    location: {
      name:        location.name,
      state:       location.state,
      country:     location.country,
      countryCode: location.countryCode,
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
