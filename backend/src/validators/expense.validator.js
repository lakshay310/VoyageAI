// src/validators/expense.validator.js
// Input validation rules for expense routes.

const { body } = require('express-validator');

// Must match the ExpenseCategory enum in schema.prisma
const VALID_CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'ACCOMMODATION',
  'ACTIVITIES',
  'SHOPPING',
  'OTHER',
];

const createExpenseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Expense title is required.'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number.'),

  body('category')
    .notEmpty()
    .withMessage('Category is required.')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date.'),
];

const updateExpenseValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.'),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number.'),

  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date.'),
];

module.exports = { createExpenseValidator, updateExpenseValidator };
