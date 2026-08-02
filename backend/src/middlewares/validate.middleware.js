// src/middlewares/validate.middleware.js
// Works with express-validator to check request body/params.
// Usage: add validators to a route, then call validate() as next middleware.

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return all validation messages to help the user fix the form
    return sendError(res, 'Validation failed.', 422, errors.array());
  }

  next();
};

module.exports = validate;
