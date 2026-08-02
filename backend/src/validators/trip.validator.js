// src/validators/trip.validator.js
// Input validation rules for trip routes.
// These run before the controller so invalid data is rejected early.

const { body } = require('express-validator');

// Valid status values must match the TripStatus enum in schema.prisma
const VALID_STATUSES = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

const createTripValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Trip title is required.'),

  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required.'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required.')
    .isISO8601()
    .withMessage('Start date must be a valid date (e.g. 2025-12-01).'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required.')
    .isISO8601()
    .withMessage('End date must be a valid date.'),

  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number.'),
];

const updateTripValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date.'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date.'),

  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number.'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}.`),
];

module.exports = { createTripValidator, updateTripValidator };
