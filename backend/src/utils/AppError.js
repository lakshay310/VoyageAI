// src/utils/AppError.js
// Custom error class that attaches an HTTP status code to any thrown error.
// Using this lets our error.middleware.js distinguish "expected" errors
// (like 404 Not Found) from unexpected crashes (500 Internal Server Error).
//
// Usage example:
//   throw new AppError('Trip not found.', 404);
//   throw new AppError('Email already registered.', 409);

class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor so stack traces work normally
    super(message);

    this.statusCode = statusCode;

    // Mark this as an "operational" error (expected, user-facing)
    // vs a "programmer" error (unexpected bug).
    // The global error handler can check this flag to decide how much
    // detail to show in the response.
    this.isOperational = true;

    // Capture the stack trace correctly (Node.js best practice)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
