// src/utils/jwt.js
// Helper functions to sign and verify JSON Web Tokens.

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Create a signed JWT token for the given user payload.
 * The token expires based on JWT_EXPIRES_IN env variable.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT token and return the decoded payload.
 * Throws if the token is invalid or expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
