// src/validators/profile.validator.js
// Input validation rules for user profile routes.

const { body } = require('express-validator');

/**
 * Validates the change-password request body.
 * Both fields are required; new password must be at least 6 chars.
 */
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters.'),
];

/**
 * Validates the update-name request body.
 */
const updateNameValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty.'),
];

module.exports = { changePasswordValidator, updateNameValidator };
