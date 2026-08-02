// src/repositories/user.repository.js
// Handles ALL database operations for the User model via Prisma.
// Services call these functions; they never touch Prisma directly.

const prisma = require('../config/database');

/**
 * Find a user by their email address.
 * Used during login to retrieve the stored hashed password.
 */
const findByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Find a user by their ID.
 * Used to fetch the logged-in user's profile.
 */
const findById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
    // Note: we never return the password field from here
  });
};

/**
 * Create a new user record in the database.
 */
const create = (data) => {
  return prisma.user.create({ data });
};

/**
 * Find a user by ID — includes the password hash.
 * ONLY used internally for password change verification.
 * Never return this to the API response.
 */
const findByIdWithPassword = (id) => {
  return prisma.user.findUnique({ where: { id } }); // returns ALL fields including password
};

/**
 * Update user fields (e.g., avatar URL after upload).
 */
const update = (id, data) => {
  return prisma.user.update({ where: { id }, data });
};

module.exports = { findByEmail, findById, findByIdWithPassword, create, update };
