// src/repositories/wishlist.repository.js
// Data-access layer for the Wishlist module.
// All Prisma queries for the Wishlist table are written here.
// Controllers and services never touch Prisma directly.

const prisma = require('../config/database');

/**
 * Create a new wishlist item for a user.
 * @param {object} data - { userId, destination, country, category, notes, priority }
 */
const create = async (data) => {
  return prisma.wishlist.create({ data });
};

/**
 * Get all wishlist items for a specific user.
 * Sorted by priority (High first), then by newest first.
 * @param {string} userId
 */
const findAllByUser = async (userId) => {
  return prisma.wishlist.findMany({
    where:   { userId },
    orderBy: [
      { priority: 'asc' },    // 1=High comes before 2=Medium, 3=Low
      { createdAt: 'desc' },  // newest first within same priority
    ],
  });
};

/**
 * Find a single wishlist item by ID — verifies it belongs to the user.
 * @param {string} id
 * @param {string} userId
 */
const findById = async (id, userId) => {
  return prisma.wishlist.findFirst({
    where: { id, userId },
  });
};

/**
 * Update a wishlist item (e.g., edit notes, change priority, mark visited).
 * @param {string} id     - Wishlist item ID
 * @param {string} userId - Guard: only the owner can update
 * @param {object} data   - Fields to update
 */
const update = async (id, userId, data) => {
  // updateMany with userId guard prevents unauthorized updates
  return prisma.wishlist.updateMany({
    where: { id, userId },
    data,
  });
};

/**
 * Delete a wishlist item.
 * @param {string} id
 * @param {string} userId - Guard: only the owner can delete
 */
const remove = async (id, userId) => {
  return prisma.wishlist.deleteMany({
    where: { id, userId },
  });
};

/**
 * Get a count of total items and visited items for dashboard stats.
 * @param {string} userId
 */
const getStats = async (userId) => {
  const [total, visited] = await Promise.all([
    prisma.wishlist.count({ where: { userId } }),
    prisma.wishlist.count({ where: { userId, visited: true } }),
  ]);
  return { total, visited, remaining: total - visited };
};

module.exports = { create, findAllByUser, findById, update, remove, getStats };
