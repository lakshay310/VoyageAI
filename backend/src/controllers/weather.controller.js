// src/controllers/weather.controller.js
// HTTP request handlers for the Weather module.
// Keeps each function short — just validates input, calls service, sends response.

const weatherService = require('../services/weather.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/weather/city/:city
 * Returns current weather + 7-day forecast for any city worldwide.
 *
 * Example: GET /api/weather/city/Goa
 *          GET /api/weather/city/Paris
 *          GET /api/weather/city/New%20York
 */
const getCityWeather = async (req, res, next) => {
  try {
    const { city } = req.params;

    // Validate that a city name was provided
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required.' });
    }

    const data = await weatherService.getWeatherForCity(city.trim());
    return sendSuccess(res, `Weather for ${data.location.name} fetched successfully.`, data);
  } catch (error) {
    next(error); // passed to global error handler
  }
};

/**
 * GET /api/weather/trip/:tripId
 * Fetches weather for the destination of one of the user's saved trips.
 * Useful for showing "what's the weather like at my trip destination?" on the trip page.
 */
const getTripWeather = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const data = await weatherService.getWeatherForTrip(tripId, req.user.id);
    return sendSuccess(res, `Weather for trip "${data.trip.title}" fetched successfully.`, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCityWeather,
  getTripWeather,
};
