// src/services/booking.service.js
// Business logic for bookings.
// A booking always belongs to both a trip AND a user.

const bookingRepository = require('../repositories/booking.repository');
const tripRepository = require('../repositories/trip.repository');

/**
 * Helper: verify the trip exists and belongs to the requesting user.
 * Reused across create/read/update/delete booking operations.
 */
const verifyTripOwnership = async (tripId, userId) => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  if (trip.userId !== userId) {
    const error = new Error('You are not allowed to access this trip.');
    error.statusCode = 403;
    throw error;
  }

  return trip;
};

/**
 * Create a new booking under a trip.
 */
const createBooking = async (tripId, userId, body) => {
  // Make sure this user owns the trip before adding a booking to it
  await verifyTripOwnership(tripId, userId);

  const { type, provider, reference, amount, status } = body;

  return bookingRepository.create({
    type,
    provider,
    reference,
    amount: parseFloat(amount),
    status: status || 'PENDING',
    tripId,
    userId, // also store userId directly for quick lookups
  });
};

/**
 * Get all bookings for a trip.
 */
const getBookingsForTrip = async (tripId, userId) => {
  await verifyTripOwnership(tripId, userId);
  return bookingRepository.findAllByTrip(tripId);
};

/**
 * Get ALL bookings for the logged-in user across all their trips.
 * Delegates filtering (type, status, search) to the repository.
 *
 * @param {string} userId
 * @param {object} filters - { type, status, search }
 */
const getAllBookingsForUser = async (userId, filters = {}) => {
  return bookingRepository.findAllByUser(userId, filters);
};

/**
 * Get a single booking by ID.
 * Throws 403 if the booking belongs to a different user.
 */
const getBookingById = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.userId !== userId) {
    const error = new Error('You are not allowed to access this booking.');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Update a booking (e.g., mark as CONFIRMED after payment).
 */
const updateBooking = async (bookingId, userId, body) => {
  const booking = await bookingRepository.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify the parent trip belongs to this user
  await verifyTripOwnership(booking.tripId, userId);

  const updateData = {};
  if (body.type) updateData.type = body.type;
  if (body.provider) updateData.provider = body.provider;
  if (body.reference !== undefined) updateData.reference = body.reference;
  if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
  if (body.status) updateData.status = body.status;

  return bookingRepository.update(bookingId, updateData);
};

/**
 * Delete a booking.
 */
const deleteBooking = async (bookingId, userId) => {
  const booking = await bookingRepository.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTripOwnership(booking.tripId, userId);
  return bookingRepository.remove(bookingId);
};

module.exports = {
  createBooking,
  getBookingsForTrip,
  getAllBookingsForUser,
  getBookingById,
  updateBooking,
  deleteBooking,
};
