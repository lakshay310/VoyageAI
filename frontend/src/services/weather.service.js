// src/services/weather.service.js
// Axios wrapper functions for the Weather API endpoints.

import api from './api';

/** Fetch current weather + 7-day forecast for any city */
export const getCityWeather = (city) =>
  api.get(`/weather/city/${encodeURIComponent(city)}`);

/** Fetch weather for the destination of a saved trip */
export const getTripWeather = (tripId) =>
  api.get(`/weather/trip/${tripId}`);
