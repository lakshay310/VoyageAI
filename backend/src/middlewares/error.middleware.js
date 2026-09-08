// src/middlewares/error.middleware.js
// Global error handler — MUST be registered LAST in app.js (after all routes).
// Express identifies this as an error handler because it has 4 parameters: (err, req, res, next).
//
// This single handler catches ALL errors from any route/controller/service,
// so you never have to write res.status(500).json(...) inside a controller.

const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // Always log the error for debugging (even in production)
  console.error('[ERROR]', err.message);

  // ── Prisma: Record not found (e.g. findUniqueOrThrow) ──────────────────────
  // Prisma throws a specific error code when a record is missing
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404);
  }

  // ── Prisma: Unique constraint violation (e.g. duplicate email) ─────────────
  // err.meta.target tells us which field caused the conflict
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return sendError(res, `${field} already exists. Please use a different value.`, 409);
  }

  // ── Prisma: Foreign key constraint failed ──────────────────────────────────
  if (err.code === 'P2003') {
    return sendError(res, 'Related record not found. Please check your input.', 400);
  }

  // ── JWT: Token is malformed or has an invalid signature ────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token. Please log in again.', 401);
  }

  // ── JWT: Token has expired ──────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Your session has expired. Please log in again.', 401);
  }

  // ── Express-validator / Joi validation errors ──────────────────────────────
  // These are thrown manually by validate.middleware.js (status 422)
  if (err.statusCode === 422) {
    return sendError(res, err.message || 'Validation failed.', 422, err.errors);
  }

  // ── Operational errors (thrown via AppError or plain Error with statusCode) ─
  // These are expected, user-facing errors we throw deliberately in services.
  // Example: throw new AppError('Trip not found.', 404)
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode);
  }

  // ── Unknown / unexpected errors ─────────────────────────────────────────────
  // In production: hide the real error message (security best practice).
  // In development: show the full message to help debugging.
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment
    ? err.message
    : 'Something went wrong. Please try again later.';

  return sendError(res, message, 500);
};

module.exports = errorHandler;
