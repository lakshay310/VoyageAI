// src/services/review.service.js
// Business logic for the Reviews & Ratings module.
// Validates inputs and delegates to the repository layer.

const AppError           = require('../utils/AppError');
const reviewRepo         = require('../repositories/review.repository');
const notificationService = require('./notification.service');

const VALID_TARGETS = ['HOTEL', 'FLIGHT', 'TRIP'];

/**
 * Submit a new review.
 * Prevents duplicate reviews (one user = one review per item).
 */
const submitReview = async (userId, body) => {
  const { targetType, targetId, rating, comment } = body;

  if (!VALID_TARGETS.includes(targetType)) {
    throw new AppError(`targetType must be one of: ${VALID_TARGETS.join(', ')}`, 400);
  }

  // Validate rating range (1 – 5 stars)
  const stars = parseInt(rating);
  if (!stars || stars < 1 || stars > 5) {
    throw new AppError('Rating must be a number between 1 and 5.', 400);
  }

  if (!targetId) {
    throw new AppError('targetId is required.', 400);
  }

  // Check: has this user already reviewed this item?
  const existing = await reviewRepo.findUserReviewForTarget(userId, targetType, targetId);
  if (existing) {
    throw new AppError('You have already reviewed this item. Please edit your existing review.', 409);
  }

  const review = await reviewRepo.create({
    userId,
    targetType,
    targetId,
    rating:  stars,
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
    throw new AppError('Invalid targetType.', 400);
  }

  const [reviews, stats] = await Promise.all([
    reviewRepo.findByTarget(targetType, targetId),
    reviewRepo.getStats(targetType, targetId),
  ]);

  return { reviews, stats };
};

/** Get all reviews written by the logged-in user. */
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
      throw new AppError('Rating must be between 1 and 5.', 400);
    }
    updateData.rating = stars;
  }
  if (comment !== undefined) updateData.comment = comment?.trim() || null;

  const result = await reviewRepo.update(id, userId, updateData);
  if (result.count === 0) {
    throw new AppError('Review not found or you do not have permission to edit it.', 404);
  }

  return { message: 'Review updated successfully.' };
};

/** Delete a review — only the author can do this. */
const deleteReview = async (id, userId) => {
  const result = await reviewRepo.remove(id, userId);
  if (result.count === 0) {
    throw new AppError('Review not found or you do not have permission to delete it.', 404);
  }
};

module.exports = { submitReview, getTargetReviews, getMyReviews, updateReview, deleteReview };
