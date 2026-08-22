// src/services/review.service.js
// Frontend API wrappers for all Review endpoints.
// Uses the shared axios instance that auto-attaches the JWT.

import api from './api';

/** Submit a new review (targetType, targetId, rating, comment) */
export const submitReview = (data) => api.post('/reviews', data);

/** Get all reviews + stats for a specific hotel/flight/trip */
export const getTargetReviews = (targetType, targetId) =>
  api.get(`/reviews/${targetType}/${targetId}`);

/** Get all reviews written by the logged-in user */
export const getMyReviews = () => api.get('/reviews/my');

/** Update an existing review */
export const updateReview = (id, data) => api.patch(`/reviews/${id}`, data);

/** Delete a review */
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
