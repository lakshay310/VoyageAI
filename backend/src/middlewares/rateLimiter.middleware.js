// src/middlewares/rateLimiter.middleware.js
// Rate limiting middleware to prevent abuse and brute-force attacks.
// We use the 'express-rate-limit' package — no database needed, counts in memory.

const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Allows 200 requests per 15 minutes from a single IP.
 * Applied to ALL routes in app.js.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 200,                  // Maximum requests per window per IP
  standardHeaders: true,     // Return rate limit info in the 'RateLimit-*' headers
  legacyHeaders: false,      // Disable old 'X-RateLimit-*' headers
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict Auth Rate Limiter
 * Allows only 10 login/register attempts per 15 minutes.
 * Protects against brute-force password attacks.
 * Applied ONLY to /api/auth/login and /api/auth/register.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // Only 10 attempts allowed
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  // Skip rate limiting in test environment so tests run without interference
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { generalLimiter, authLimiter };
