// src/validators/ai.validator.js
// Validates AI-related endpoints — itinerary generation and chatbot messages.

const { body } = require('express-validator');

// ── Itinerary generator validator ─────────────────────────────────────────────
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

// ── Chatbot message validator ──────────────────────────────────────────────────
// Validates the user's chat message and optional conversation history.
// history is an array of { role: 'user'|'model', text: string } objects.
const chatValidator = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message cannot be empty.')
    .isLength({ max: 500 }).withMessage('Message must be under 500 characters.'),

  body('history')
    .optional()
    .isArray().withMessage('History must be an array of chat turns.'),
];

module.exports = { generateValidator, chatValidator };
