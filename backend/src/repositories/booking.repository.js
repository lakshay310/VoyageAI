// src/repositories/booking.repository.js
// Handles ALL database queries for the Booking model via Prisma.
// Called by booking.service.js — never from controllers directly.

const prisma = require('../config/database');

/**
 * Create a new booking attached to a trip and user.
 */
const create = (data) => prisma.booking.create({ data });

/**
 * Get all bookings for a specific trip (used inside trip detail view).
 * Ordered by most recent first.
 */
const findAllByTrip = (tripId) =>
  prisma.booking.findMany({
    where: { tripId },
    include: { trip: { select: { id: true, title: true, destination: true } } },
    orderBy: { bookedAt: 'desc' },
  });

/**
 * Get ALL bookings for a user across every trip they own.
 * Supports optional filters: type, status, and a text search.
 *
 * @param {string} userId
 * @param {object} filters - { type, status, search }
 */
const findAllByUser = (userId, { type, status, search } = {}) => {
  // Build WHERE clause dynamically — only add conditions that are provided
  const where = { userId };

  if (type   && type   !== 'ALL') where.type   = type;
  if (status && status !== 'ALL') where.status  = status;

  if (search) {
    // Search across provider name, reference code, and the linked trip name
    where.OR = [
      { provider:  { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { trip: { title:       { contains: search, mode: 'insensitive' } } },
      { trip: { destination: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return prisma.booking.findMany({
    where,
    // Include trip so the UI can show trip name + link
    include: { trip: { select: { id: true, title: true, destination: true } } },
    orderBy: { bookedAt: 'desc' },
  });
};

/**
 * Get a single booking by ID (includes parent trip info).
 */
const findById = (id) =>
  prisma.booking.findUnique({
    where: { id },
    include: { trip: { select: { id: true, title: true, destination: true } } },
  });

/**
 * Update a booking's fields (e.g., status, reference code).
 */
const update = (id, data) =>
  prisma.booking.update({
    where: { id },
    data,
    include: { trip: { select: { id: true, title: true, destination: true } } },
  });

/**
 * Delete a booking by ID.
 */
const remove = (id) => prisma.booking.delete({ where: { id } });

module.exports = { create, findAllByTrip, findAllByUser, findById, update, remove };
