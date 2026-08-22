// src/routes/review.routes.js
// Express router for the Reviews & Ratings module.
// All routes require authentication.

const express           = require('express');
const router            = express.Router();
const { protect }       = require('../middlewares/auth.middleware');
const reviewController  = require('../controllers/review.controller');

// All review routes require a valid JWT
router.use(protect);

// POST   /api/reviews                         → submit a new review
router.post('/',                         reviewController.submit);

// GET    /api/reviews/my                      → all reviews by logged-in user
// ⚠️ This must come BEFORE /:targetType/:targetId to prevent "my" matching as targetType
router.get('/my',                        reviewController.getMyReviews);

// GET    /api/reviews/:targetType/:targetId   → all reviews for one hotel/flight/trip
router.get('/:targetType/:targetId',    reviewController.getForTarget);

// PATCH  /api/reviews/:id                     → edit a review
router.patch('/:id',                    reviewController.update);

// DELETE /api/reviews/:id                     → delete a review
router.delete('/:id',                   reviewController.remove);

module.exports = router;
