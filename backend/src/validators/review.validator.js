// src/validators/review.validator.js
// Validation rules for review routes.

const { body } = require('express-validator');

const createReviewValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Review title is required.'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Review content cannot be empty.'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required.')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be a number between 1 and 5.'),

  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required.'),
];

const updateReviewValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.'),

  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty.'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be a number between 1 and 5.'),
];

module.exports = { createReviewValidator, updateReviewValidator };
