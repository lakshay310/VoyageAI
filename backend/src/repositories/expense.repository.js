// src/repositories/expense.repository.js
// Handles ALL database operations for the Expense model via Prisma.

const prisma = require('../config/database');

/**
 * Create a new expense for a trip.
 */
const create = (data) => {
  return prisma.expense.create({ data });
};

/**
 * Get all expenses for a specific trip.
 * Ordered by date descending (most recent first).
 */
const findAllByTrip = (tripId) => {
  return prisma.expense.findMany({
    where: { tripId },
    orderBy: { date: 'desc' },
  });
};

/**
 * Get a single expense by its ID.
 */
const findById = (id) => {
  return prisma.expense.findUnique({ where: { id } });
};

/**
 * Update an expense's fields.
 */
const update = (id, data) => {
  return prisma.expense.update({ where: { id }, data });
};

/**
 * Delete an expense by ID.
 */
const remove = (id) => {
  return prisma.expense.delete({ where: { id } });
};

/**
 * Get a sum of all expenses for a trip grouped by category.
 * Useful for showing a breakdown chart on the frontend.
 *
 * Returns: [{ category: 'FOOD', _sum: { amount: 1500 } }, ...]
 */
const getSummaryByTrip = (tripId) => {
  return prisma.expense.groupBy({
    by: ['category'],
    where: { tripId },
    _sum: { amount: true },
  });
};

module.exports = { create, findAllByTrip, findById, update, remove, getSummaryByTrip };
