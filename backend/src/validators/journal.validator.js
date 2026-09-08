// src/validators/journal.validator.js
// Validation rules for journal entry routes.

const { body } = require('express-validator');

const createJournalValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Journal title is required.'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Journal content is required.'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date (e.g. 2025-12-01).'),
];

const updateJournalValidator = [
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
];

module.exports = { createJournalValidator, updateJournalValidator };
