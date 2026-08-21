// src/repositories/journal.repository.js
// Data-access layer for the Travel Journal module.
// All Prisma queries for JournalEntry table live here.
// Services never write SQL/Prisma directly.

const prisma = require('../config/database');

/**
 * Create a new journal entry.
 * @param {object} data - { tripId, title, content, mood, location, date }
 */
const create = async (data) => {
  return prisma.journalEntry.create({ data });
};

/**
 * Get all journal entries for a specific trip, newest date first.
 * We verify userId via the trip relation to prevent data leaks.
 *
 * @param {string} tripId
 * @param {string} userId - ensures the trip belongs to this user
 */
const findAllByTrip = async (tripId, userId) => {
  return prisma.journalEntry.findMany({
    where: {
      tripId,
      trip: { userId },   // join guard — only entries from this user's trip
    },
    orderBy: { date: 'desc' },   // most recent day first
    select: {
      id: true, title: true, mood: true,
      location: true, date: true, createdAt: true,
      content: true,   // included for list (short preview)
      tripId: true,
    },
  });
};

/**
 * Get all journal entries for a user across ALL their trips.
 * Used for the "My Journal" page that shows the full diary.
 * @param {string} userId
 */
const findAllByUser = async (userId) => {
  return prisma.journalEntry.findMany({
    where:   { trip: { userId } },
    orderBy: { date: 'desc' },
    include: {
      trip: { select: { id: true, title: true, destination: true } },
    },
  });
};

/**
 * Get one journal entry by ID.
 * Guards via userId on the trip to prevent cross-user access.
 *
 * @param {string} id
 * @param {string} userId
 */
const findById = async (id, userId) => {
  return prisma.journalEntry.findFirst({
    where: { id, trip: { userId } },
    include: {
      trip: { select: { id: true, title: true, destination: true } },
    },
  });
};

/**
 * Update a journal entry.
 * Uses updateMany with userId guard — only updates if it belongs to the user.
 */
const update = async (id, userId, data) => {
  return prisma.journalEntry.updateMany({
    where: { id, trip: { userId } },
    data,
  });
};

/**
 * Delete a journal entry.
 */
const remove = async (id, userId) => {
  return prisma.journalEntry.deleteMany({
    where: { id, trip: { userId } },
  });
};

/**
 * Count total journal entries for a user — used for dashboard stats.
 */
const countByUser = async (userId) => {
  return prisma.journalEntry.count({
    where: { trip: { userId } },
  });
};

module.exports = { create, findAllByTrip, findAllByUser, findById, update, remove, countByUser };
