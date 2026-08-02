// src/controllers/booking.controller.js
// HTTP layer for booking operations — reads req, calls service, sends response.

const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/trips/:tripId/bookings
 * Add a new booking to a trip.
 */
const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(
      req.params.tripId,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 'Booking created successfully!', booking, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/bookings
 * Get all bookings for a specific trip.
 */
const getBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getBookingsForTrip(
      req.params.tripId,
      req.user.id
    );
    return sendSuccess(res, 'Bookings fetched successfully.', bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings?type=FLIGHT&status=CONFIRMED&search=indigo
 * List ALL bookings for the logged-in user across all their trips.
 * Supports query string filters for type, status, and free-text search.
 */
const getUserBookings = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const bookings = await bookingService.getAllBookingsForUser(req.user.id, {
      type,
      status,
      search,
    });
    return sendSuccess(res, 'Bookings fetched successfully.', bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * Get a single booking's details (must belong to the logged-in user).
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id);
    return sendSuccess(res, 'Booking fetched successfully.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id
 * Update a booking (e.g., change status to CONFIRMED).
 */
const updateBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBooking(
      req.params.id,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 'Booking updated successfully.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id
 * Delete a booking.
 */
const deleteBooking = async (req, res, next) => {
  try {
    await bookingService.deleteBooking(req.params.id, req.user.id);
    return sendSuccess(res, 'Booking deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getUserBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
