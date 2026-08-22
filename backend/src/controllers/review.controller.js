// src/controllers/review.controller.js
// HTTP handlers for the Reviews & Ratings module.
// Pattern: extract → validate shape → call service → send response.

const reviewService = require('../services/review.service');
const { sendSuccess } = require('../utils/response');

/** POST /api/reviews — Submit a new review */
const submit = async (req, res, next) => {
  try {
    const review = await reviewService.submitReview(req.user.id, req.body);
    return sendSuccess(res, 'Review submitted successfully!', review, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:targetType/:targetId
 * Get all reviews + avg rating for one hotel / flight / trip
 */
const getForTarget = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const data = await reviewService.getTargetReviews(
      targetType.toUpperCase(),   // accept lowercase from URL
      targetId
    );
    return sendSuccess(res, 'Reviews fetched.', data);
  } catch (error) {
    next(error);
  }
};

/** GET /api/reviews/my — Get all reviews by the logged-in user */
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user.id);
    return sendSuccess(res, 'Your reviews fetched.', { reviews });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/reviews/:id — Edit a review */
const update = async (req, res, next) => {
  try {
    const result = await reviewService.updateReview(req.params.id, req.user.id, req.body);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/reviews/:id — Delete a review */
const remove = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id);
    return sendSuccess(res, 'Review deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { submit, getForTarget, getMyReviews, update, remove };
