// src/services/trip.service.js
// Business logic for trips.
// Sits between the Controller (HTTP) and Repository (DB).

const AppError              = require('../utils/AppError');
const tripRepository        = require('../repositories/trip.repository');
const notificationService   = require('./notification.service');
const { invalidateDashboardCache } = require('./dashboard.service');

/**
 * Verify a trip exists and belongs to the requesting user.
 * Exported so booking, expense, and journal services can reuse this
 * check without copy-pasting the same logic.
 *
 * @param {string} tripId
 * @param {string} userId
 * @returns {Promise<Trip>} the trip record
 */
const verifyTripOwnership = async (tripId, userId) => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }

  if (trip.userId !== userId) {
    throw new AppError('You are not allowed to access this trip.', 403);
  }

  return trip;
};

/**
 * Create a new trip.
 * Attaches the userId (from the logged-in user) before saving.
 */
const createTrip = async (userId, body) => {
  const { title, destination, startDate, endDate, budget, notes, itinerary } = body;

  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError('End date must be after start date.', 400);
  }

  const trip = await tripRepository.create({
    title,
    destination,
    startDate:  new Date(startDate),
    endDate:    new Date(endDate),
    budget:     budget ? parseFloat(budget) : 0,
    notes,
    itinerary:  itinerary || null,
    userId,
  });

  // 🔔 Send real-time notification to the user
  await notificationService.createAndEmit(userId, {
    title:   'Trip Created! 🧳',
    message: `Your trip to ${destination} has been saved. Start adding bookings and expenses!`,
    type:    'TRIP_CREATED',
    link:    '/trips',
  });

  // Bust the dashboard cache so the count updates immediately
  invalidateDashboardCache(userId);

  return trip;
};

/** Get all trips for the logged-in user. */
const getMyTrips = async (userId) => {
  return tripRepository.findAllByUser(userId);
};

/**
 * Get one trip by ID.
 * Checks that the trip belongs to the requesting user (ownership check).
 */
const getTripById = async (tripId, userId) => {
  return verifyTripOwnership(tripId, userId);
};

/**
 * Update a trip.
 * Verifies ownership first, then updates only provided fields.
 */
const updateTrip = async (tripId, userId, body) => {
  await verifyTripOwnership(tripId, userId);

  // Build update payload — only include fields that were actually sent
  const updateData = {};
  if (body.title       !== undefined) updateData.title       = body.title;
  if (body.destination !== undefined) updateData.destination = body.destination;
  if (body.startDate   !== undefined) updateData.startDate   = new Date(body.startDate);
  if (body.endDate     !== undefined) updateData.endDate     = new Date(body.endDate);
  if (body.budget      !== undefined) updateData.budget      = parseFloat(body.budget);
  if (body.status      !== undefined) updateData.status      = body.status;
  if (body.notes       !== undefined) updateData.notes       = body.notes;
  if (body.itinerary   !== undefined) updateData.itinerary   = body.itinerary;

  const updated = await tripRepository.update(tripId, updateData);

  invalidateDashboardCache(userId);

  return updated;
};

/**
 * Delete a trip (and cascade-delete its bookings and expenses).
 */
const deleteTrip = async (tripId, userId) => {
  await verifyTripOwnership(tripId, userId);
  await tripRepository.remove(tripId);
  invalidateDashboardCache(userId);
};

module.exports = {
  verifyTripOwnership,  // exported for use by booking, expense, and journal services
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
