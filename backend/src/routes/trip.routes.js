// src/routes/trip.routes.js
// URL paths for trip endpoints.
// All routes require the user to be logged in (protect middleware).
//
// Flow: Route → Controller → Service → Repository → Prisma

const express = require('express');
const router = express.Router();

const tripController = require('../controllers/trip.controller');
const { protect } = require('../middlewares/auth.middleware');
const { createTripValidator, updateTripValidator } = require('../validators/trip.validator');
const validate = require('../middlewares/validate.middleware');

// All trip routes require authentication
router.use(protect);

// POST   /api/trips         → create a new trip
router.post('/', createTripValidator, validate, tripController.createTrip);

// GET    /api/trips         → get all trips for the logged-in user
router.get('/', tripController.getMyTrips);

// GET    /api/trips/:id     → get one trip by ID
router.get('/:id', tripController.getTripById);

// PUT    /api/trips/:id     → update a trip
router.put('/:id', updateTripValidator, validate, tripController.updateTrip);

// DELETE /api/trips/:id     → delete a trip (cascades bookings & expenses)
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
