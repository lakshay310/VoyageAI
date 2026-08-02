// src/utils/response.js
// Standard API response helpers so every endpoint sends the same shape.
// This makes the frontend easy to parse consistently.

/**
 * Send a success response.
 * Shape: { success: true, message, data }
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * Shape: { success: false, message, errors }
 */
const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { sendSuccess, sendError };
