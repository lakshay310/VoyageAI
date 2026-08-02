// src/validators/ai.validator.js
// Validates the AI itinerary generation request.
// We check required fields and sensible ranges before calling the expensive AI API.

const { body } = require('express-validator');

const generateValidator = [
  body('destination')
    .trim()
    .notEmpty().withMessage('Destination is required.')
    .isLength({ max: 100 }).withMessage('Destination must be under 100 characters.'),

  body('days')
    .notEmpty().withMessage('Number of days is required.')
    .isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30.'),

  body('budget')
    .notEmpty().withMessage('Budget is required.')
    .isInt({ min: 1000 }).withMessage('Budget must be at least ₹1000.'),

  body('travelStyle')
    .optional()
    .isIn(['budget', 'balanced', 'luxury']).withMessage('Travel style must be budget, balanced, or luxury.'),

  body('interests')
    .optional()
    .isString()
    .isLength({ max: 200 }).withMessage('Interests must be under 200 characters.'),
];

module.exports = { generateValidator };
