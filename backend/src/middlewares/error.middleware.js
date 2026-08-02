// src/middlewares/error.middleware.js
// Global error handler. Must be registered LAST in app.js.
// Catches any error thrown by controllers/services.

const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);

  // Prisma "record not found" error
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404);
  }

  // Prisma unique constraint violation (e.g., duplicate email)
  if (err.code === 'P2002') {
    return sendError(res, `${err.meta?.target} already exists.`, 409);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }

  // Default: internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode);
};

module.exports = errorHandler;
