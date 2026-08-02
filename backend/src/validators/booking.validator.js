// src/validators/booking.validator.js
// Input validation rules for booking routes.

const { body } = require('express-validator');

// These must match the BookingType and BookingStatus enums in schema.prisma
const VALID_TYPES    = ['FLIGHT', 'HOTEL', 'CAR', 'ACTIVITY'];
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const createBookingValidator = [
  body('type')
    .notEmpty()
    .withMessage('Booking type is required.')
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}.`),

  body('provider')
    .trim()
    .notEmpty()
    .withMessage('Provider name is required (e.g. IndiGo, Taj Hotel).'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number.'),

  body('reference')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}.`),
];

const updateBookingValidator = [
  body('type')
    .optional()
    .isIn(VALID_TYPES)
    .withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}.`),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number.'),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}.`),
];

module.exports = { createBookingValidator, updateBookingValidator };
