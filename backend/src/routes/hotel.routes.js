// src/routes/hotel.routes.js
// Defines the URL patterns for hotel endpoints.
// Route → Controller → Service → Repository (clean layered pattern)

const express = require('express');
const router  = express.Router();

const hotelController = require('../controllers/hotel.controller');
const { protect } = require('../middlewares/auth.middleware');

// ── Public Routes (no login needed) ─────────────────────────────────────────

// Search hotels with filters
// POST /api/hotels/search
router.post('/search', hotelController.searchHotels);

// Get popular/featured hotels for the homepage chips
// GET /api/hotels/popular
router.get('/popular', hotelController.getPopularHotels);

// Get a single hotel by ID (for the detail modal)
// GET /api/hotels/:id
router.get('/:id', hotelController.getHotelById);

// ── Protected Routes (must be logged in) ─────────────────────────────────────

// Book a hotel and attach to a trip
// POST /api/hotels/book
router.post('/book', protect, hotelController.bookHotel);

module.exports = router;
