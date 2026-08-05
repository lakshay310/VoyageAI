// src/routes/map.routes.js
// Express router endpoints for maps module.

const express = require('express');
const router = express.Router();

const mapController = require('../controllers/map.controller');
const { protect } = require('../middlewares/auth.middleware');

// All map endpoints are protected
router.use(protect);

// GET /api/maps/featured          → Featured city map data
router.get('/featured', mapController.getFeaturedMap);

// GET /api/maps/search            → Search & geocode destination query
router.get('/search', mapController.searchLocation);

// GET /api/maps/city/:cityName    → City specific pins & bounds
router.get('/city/:cityName', mapController.getCityMap);

// GET /api/maps/trip/:tripId      → Trip specific route & booking pins
router.get('/trip/:tripId', mapController.getTripMap);

module.exports = router;
