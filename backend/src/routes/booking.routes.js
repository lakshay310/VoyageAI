// src/routes/booking.routes.js
// URL paths for booking endpoints.
//
// Booking routes are split into two mounting points:
//   1. Nested under trips:  /api/trips/:tripId/bookings  (create, list)
//   2. Standalone:          /api/bookings/:id            (update, delete)
//
// We export two routers to handle both patterns.

const express = require('express');

// Nested router — mounted at /api/trips/:tripId/bookings
// mergeParams: true lets us access req.params.tripId from the parent router
const nestedRouter = express.Router({ mergeParams: true });

// Standalone router — mounted at /api/bookings
const standaloneRouter = express.Router();

const bookingController = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth.middleware');
const { createBookingValidator, updateBookingValidator } = require('../validators/booking.validator');
const validate = require('../middlewares/validate.middleware');

// ── Nested routes (under /api/trips/:tripId/bookings) ────────────────────────
nestedRouter.use(protect);

// POST   /api/trips/:tripId/bookings  → create a booking for a trip
nestedRouter.post('/', createBookingValidator, validate, bookingController.createBooking);

// GET    /api/trips/:tripId/bookings  → list all bookings for a trip
nestedRouter.get('/', bookingController.getBookings);

// ── Standalone routes (under /api/bookings) ───────────────────────────────────
standaloneRouter.use(protect);

// GET    /api/bookings             → list all bookings for the logged-in user (supports ?type=&status=&search=)
standaloneRouter.get('/', bookingController.getUserBookings);

// GET    /api/bookings/:id         → get one booking's details
standaloneRouter.get('/:id', bookingController.getBookingById);

// PUT    /api/bookings/:id         → update a booking (status, reference, etc.)
standaloneRouter.put('/:id', updateBookingValidator, validate, bookingController.updateBooking);

// DELETE /api/bookings/:id         → remove a booking
standaloneRouter.delete('/:id', bookingController.deleteBooking);

module.exports = { nestedRouter, standaloneRouter };
