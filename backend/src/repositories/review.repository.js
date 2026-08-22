// src/repositories/review.repository.js
// Data-access layer — all Prisma queries for the Review table.
// Services never touch Prisma directly; they go through here.

const prisma = require('../config/database');

/**
 * Create a new review.
 * The @@unique constraint in schema prevents duplicate reviews.
 * @param {object} data - { userId, targetType, targetId, rating, comment }
 */
const create = async (data) => {
  return prisma.review.create({
    data,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
};

/**
 * Get all reviews for a specific target (e.g., all reviews for hotel X).
 * @param {string} targetType - 'HOTEL' | 'FLIGHT' | 'TRIP'
 * @param {string} targetId   - UUID of the hotel/flight/trip
 */
const findByTarget = async (targetType, targetId) => {
  return prisma.review.findMany({
    where:   { targetType, targetId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
};

/**
 * Get all reviews written by a specific user.
 * @param {string} userId
 */
const findByUser = async (userId) => {
  return prisma.review.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Find a specific review by a user for one target item.
 * Used to check if the user has already reviewed this item.
 */
const findUserReviewForTarget = async (userId, targetType, targetId) => {
  return prisma.review.findUnique({
    where: {
      // Uses the @@unique([userId, targetType, targetId]) compound key
      userId_targetType_targetId: { userId, targetType, targetId },
    },
  });
};

/**
 * Update a review (rating or comment).
 * @param {string} id
 * @param {string} userId - guard: only the author can update
 * @param {object} data   - { rating?, comment? }
 */
const update = async (id, userId, data) => {
  return prisma.review.updateMany({
    where: { id, userId },
    data,
  });
};

/**
 * Delete a review.
 * @param {string} id
 * @param {string} userId - guard: only the author can delete
 */
const remove = async (id, userId) => {
  return prisma.review.deleteMany({ where: { id, userId } });
};

/**
 * Get the average rating + review count for a target item.
 * Used to display "4.3 ★ (12 reviews)" on hotel/flight cards.
 */
const getStats = async (targetType, targetId) => {
  const result = await prisma.review.aggregate({
    where:   { targetType, targetId },
    _avg:    { rating: true },
    _count:  { rating: true },
  });
  return {
    average: result._avg.rating
      ? parseFloat(result._avg.rating.toFixed(1))
      : null,
    count: result._count.rating,
  };
};

module.exports = {
  create, findByTarget, findByUser,
  findUserReviewForTarget, update, remove, getStats,
};
