// src/validators/auth.validator.js
// Input validation rules for auth routes using express-validator.
// These run BEFORE the controller so bad data never reaches business logic.

const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { registerValidator, loginValidator };
