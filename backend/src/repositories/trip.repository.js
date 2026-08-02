// src/repositories/trip.repository.js
// Handles ALL database operations for the Trip model via Prisma.
// The Service layer calls these functions — never Prisma directly.

const prisma = require('../config/database');

/**
 * Create a new trip for a user.
 * @param {object} data - Trip fields + userId
 */
const create = (data) => {
  return prisma.trip.create({ data });
};

/**
 * Get all trips that belong to a specific user.
 * We include a count of bookings and expenses for display on the list page.
 */
const findAllByUser = (userId) => {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }, // newest trips first
    include: {
      _count: {
        select: { bookings: true, expenses: true },
      },
    },
  });
};

/**
 * Get one trip by its ID.
 * Includes full bookings and expenses so the detail page has everything.
 */
const findById = (id) => {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      bookings: { orderBy: { bookedAt: 'desc' } },
      expenses: { orderBy: { date: 'desc' } },
    },
  });
};

/**
 * Update specific fields of a trip.
 * Only the fields provided in `data` will be changed.
 */
const update = (id, data) => {
  return prisma.trip.update({ where: { id }, data });
};

/**
 * Delete a trip (and all its bookings + expenses via CASCADE in schema).
 */
const remove = (id) => {
  return prisma.trip.delete({ where: { id } });
};

module.exports = { create, findAllByUser, findById, update, remove };
