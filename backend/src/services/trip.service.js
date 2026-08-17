// src/services/trip.service.js
// Business logic for trips.
// Sits between the Controller (HTTP) and Repository (DB).

const tripRepository     = require('../repositories/trip.repository');
const notificationService = require('./notification.service'); // for real-time alerts

/**
 * Create a new trip.
 * We attach the userId (from the logged-in user) before saving.
 */
const createTrip = async (userId, body) => {
  // Include itinerary so AI-generated plans can be saved with the trip
  const { title, destination, startDate, endDate, budget, notes, itinerary } = body;

  // Validate that end date is after start date
  if (new Date(endDate) <= new Date(startDate)) {
    const error = new Error('End date must be after start date.');
    error.statusCode = 400;
    throw error;
  }

  const trip = await tripRepository.create({
    title,
    destination,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    budget: budget ? parseFloat(budget) : 0,
    notes,
    itinerary: itinerary || null, // save AI itinerary if provided
    userId,   // link this trip to the logged-in user
  });

  // 🔔 Send real-time notification to the user
  await notificationService.createAndEmit(userId, {
    title:   'Trip Created! 🧳',
    message: `Your trip to ${destination} has been saved. Start adding bookings and expenses!`,
    type:    'TRIP_CREATED',
    link:    `/trips`,
  });

  return trip;
};

/**
 * Get all trips for the logged-in user.
 */
const getMyTrips = async (userId) => {
  return tripRepository.findAllByUser(userId);
};

/**
 * Get one trip by ID.
 * Checks that the trip belongs to the requesting user (ownership check).
 */
const getTripById = async (tripId, userId) => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  // Security: a user should only see their own trips
  if (trip.userId !== userId) {
    const error = new Error('You are not allowed to view this trip.');
    error.statusCode = 403;
    throw error;
  }

  return trip;
};

/**
 * Update a trip.
 * First verifies ownership, then updates only provided fields.
 */
const updateTrip = async (tripId, userId, body) => {
  // Reuse getTripById for ownership check
  await getTripById(tripId, userId);

  // Build update payload — only include fields that were actually sent
  const updateData = {};
  if (body.title) updateData.title = body.title;
  if (body.destination) updateData.destination = body.destination;
  if (body.startDate) updateData.startDate = new Date(body.startDate);
  if (body.endDate) updateData.endDate = new Date(body.endDate);
  if (body.budget !== undefined) updateData.budget = parseFloat(body.budget);
  if (body.status) updateData.status = body.status;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.itinerary !== undefined) updateData.itinerary = body.itinerary; // allow updating AI itinerary

  return tripRepository.update(tripId, updateData);
};

/**
 * Delete a trip (and cascade-delete its bookings and expenses).
 */
const deleteTrip = async (tripId, userId) => {
  // Ownership check before deleting
  await getTripById(tripId, userId);
  return tripRepository.remove(tripId);
};

module.exports = { createTrip, getMyTrips, getTripById, updateTrip, deleteTrip };
