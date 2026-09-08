// src/__tests__/utils.test.js
// Unit tests for utility functions (AppError class, JWT helpers, response helpers).
// These are pure unit tests — no HTTP requests, no database.

const AppError = require('../utils/AppError');
const { generateToken, verifyToken } = require('../utils/jwt');

// ── AppError unit tests ────────────────────────────────────────────────────
describe('AppError Class', () => {

  it('should create an error with a message and status code', () => {
    const error = new AppError('Trip not found.', 404);

    // The message should be passed through to Error
    expect(error.message).toBe('Trip not found.');

    // Status code should be stored
    expect(error.statusCode).toBe(404);

    // isOperational should be true — distinguishes known errors from bugs
    expect(error.isOperational).toBe(true);

    // It should be an instance of Error (inherits from it)
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should work with a 409 Conflict status', () => {
    const error = new AppError('Email already exists.', 409);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Email already exists.');
  });

  it('should have a stack trace', () => {
    const error = new AppError('Test error', 400);
    // Stack trace should exist (helps debugging)
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});

// ── JWT utility unit tests ─────────────────────────────────────────────────
describe('JWT Utilities', () => {

  const payload = { id: 'user-123', email: 'test@test.com', role: 'USER' };

  it('should generate a valid token string', () => {
    const token = generateToken(payload);

    // JWT tokens have 3 parts separated by dots: header.payload.signature
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a generated token and return the original payload', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    // The decoded payload should match what we signed
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw an error when verifying an invalid token', () => {
    // Tampered/garbage token should throw JsonWebTokenError
    expect(() => verifyToken('this.is.invalid')).toThrow();
  });
});
