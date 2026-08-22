// src/services/review.service.js
// Business logic for the Reviews & Ratings module.
// Validates inputs and delegates to the repository layer.

const reviewRepo         = require('../repositories/review.repository');
const notificationService = require('./notification.service');

const VALID_TARGETS = ['HOTEL', 'FLIGHT', 'TRIP'];

/**
 * Submit a new review.
 * Prevents duplicate reviews (one user = one review per item).
 */
const submitReview = async (userId, body) => {
  const { targetType, targetId, rating, comment } = body;

  // Validate targetType
  if (!VALID_TARGETS.includes(targetType)) {
    const err = new Error(`targetType must be one of: ${VALID_TARGETS.join(', ')}`);
    err.statusCode = 400; throw err;
  }

  // Validate rating range (1 – 5 stars)
  const stars = parseInt(rating);
  if (!stars || stars < 1 || stars > 5) {
    const err = new Error('Rating must be a number between 1 and 5.');
    err.statusCode = 400; throw err;
  }

  if (!targetId) {
    const err = new Error('targetId is required.');
    err.statusCode = 400; throw err;
  }

  // Check: has this user already reviewed this item?
  const existing = await reviewRepo.findUserReviewForTarget(userId, targetType, targetId);
  if (existing) {
    const err = new Error('You have already reviewed this item. Please edit your existing review.');
    err.statusCode = 409; throw err;   // 409 = Conflict
  }

  const review = await reviewRepo.create({
    userId,
    targetType,
    targetId,
    rating: stars,
    comment: comment?.trim() || null,
  });

  // 🔔 Notify user their review was saved
  await notificationService.createAndEmit(userId, {
    title:   '⭐ Review Submitted!',
    message: `Your ${stars}-star review has been saved. Thanks for sharing your experience!`,
    type:    'SUCCESS',
    link:    '/reviews',
  });

  return review;
};

/**
 * Get all reviews + aggregate stats (avg rating, count) for one item.
 */
const getTargetReviews = async (targetType, targetId) => {
  if (!VALID_TARGETS.includes(targetType)) {
    const err = new Error('Invalid targetType.'); err.statusCode = 400; throw err;
  }

  const [reviews, stats] = await Promise.all([
    reviewRepo.findByTarget(targetType, targetId),
    reviewRepo.getStats(targetType, targetId),
  ]);

  return { reviews, stats };
};

/** Get all reviews written by the logged-in user */
const getMyReviews = async (userId) => {
  return reviewRepo.findByUser(userId);
};

/**
 * Update an existing review.
 * Only the author can update their own review.
 */
const updateReview = async (id, userId, body) => {
  const { rating, comment } = body;

  const updateData = {};
  if (rating !== undefined) {
    const stars = parseInt(rating);
    if (stars < 1 || stars > 5) {
      const err = new Error('Rating must be between 1 and 5.');
      err.statusCode = 400; throw err;
    }
    updateData.rating = stars;
  }
  if (comment !== undefined) updateData.comment = comment?.trim() || null;

  const result = await reviewRepo.update(id, userId, updateData);
  if (result.count === 0) {
    const err = new Error('Review not found or you do not have permission to edit it.');
    err.statusCode = 404; throw err;
  }

  return { message: 'Review updated successfully.' };
};

/** Delete a review — only the author can do this */
const deleteReview = async (id, userId) => {
  const result = await reviewRepo.remove(id, userId);
  if (result.count === 0) {
    const err = new Error('Review not found or you do not have permission to delete it.');
    err.statusCode = 404; throw err;
  }
};

module.exports = { submitReview, getTargetReviews, getMyReviews, updateReview, deleteReview };
