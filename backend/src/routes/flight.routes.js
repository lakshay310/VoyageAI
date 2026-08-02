// src/routes/flight.routes.js
// Express routes for Flight Search module.

const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public route: popular flights
router.get('/popular', flightController.getPopularRoutes);

// Public route: flight search (accepts GET query params or POST JSON payload)
router.get('/search', flightController.searchFlights);
router.post('/search', flightController.searchFlights);

// Protected route: book flight and save booking to trip
router.post('/book', protect, flightController.bookFlight);

module.exports = router;
