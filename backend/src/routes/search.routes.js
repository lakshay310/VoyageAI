// src/routes/search.routes.js
// Express router for the Search, Filter & Pagination module.
// All routes require authentication (JWT).

const express          = require('express');
const router           = express.Router();
const { protect }      = require('../middlewares/auth.middleware');
const searchController = require('../controllers/search.controller');

// All search routes need a valid JWT
router.use(protect);

// GET /api/search?q=               → global search (hotels + flights + trips + wishlist)
router.get('/',          searchController.global);

// GET /api/search/hotels?...       → paginated + filtered hotel search
router.get('/hotels',    searchController.hotels);

// GET /api/search/flights?...      → paginated + filtered flight search
router.get('/flights',   searchController.flights);

// GET /api/search/trips?...        → paginated + filtered trip search (user-scoped)
router.get('/trips',     searchController.trips);

// GET /api/search/wishlist?...     → paginated + filtered wishlist search (user-scoped)
router.get('/wishlist',  searchController.wishlist);

module.exports = router;
