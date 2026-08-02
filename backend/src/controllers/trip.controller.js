// src/controllers/trip.controller.js
// Reads from req, calls the service, sends the HTTP response.
// No business logic — just thin HTTP wrappers.

const tripService = require('../services/trip.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/trips
 * Create a new trip for the logged-in user.
 */
const createTrip = async (req, res, next) => {
  try {
    // req.user.id is set by the protect middleware after JWT verification
    const trip = await tripService.createTrip(req.user.id, req.body);
    return sendSuccess(res, 'Trip created successfully!', trip, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips
 * Get all trips belonging to the logged-in user.
 */
const getMyTrips = async (req, res, next) => {
  try {
    const trips = await tripService.getMyTrips(req.user.id);
    return sendSuccess(res, 'Trips fetched successfully.', trips);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id
 * Get a single trip by ID (must be owned by the logged-in user).
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.id);
    return sendSuccess(res, 'Trip fetched successfully.', trip);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id
 * Update a trip (only the owner can update).
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
    return sendSuccess(res, 'Trip updated successfully.', trip);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:id
 * Delete a trip (and its bookings/expenses via cascade).
 */
const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user.id);
    return sendSuccess(res, 'Trip deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { createTrip, getMyTrips, getTripById, updateTrip, deleteTrip };
