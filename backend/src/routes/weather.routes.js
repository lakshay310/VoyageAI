// src/routes/weather.routes.js
// Express router for all weather-related endpoints.
// All routes require a valid JWT token (protected by auth middleware).

const express    = require('express');
const router     = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const weatherController = require('../controllers/weather.controller');

// Protect all weather routes — only logged-in users can access
router.use(protect);

// GET /api/weather/city/:city
// Fetch current weather + 7-day forecast for any worldwide city
router.get('/city/:city', weatherController.getCityWeather);

// GET /api/weather/trip/:tripId
// Fetch weather for the destination of a saved trip
router.get('/trip/:tripId', weatherController.getTripWeather);

module.exports = router;
