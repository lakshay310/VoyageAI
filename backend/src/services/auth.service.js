// src/services/auth.service.js
// Business logic for authentication.
// Controllers call these functions; this layer never touches HTTP (req/res).

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user.
 * 1. Check if email already taken.
 * 2. Hash the password.
 * 3. Save user to DB.
 * 4. Return a signed JWT.
 */
const register = async ({ name, email, password }) => {
  // Check for duplicate email
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // bcrypt.hash(password, saltRounds) — 10 is the recommended cost factor
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user to DB
  const user = await userRepository.create({ name, email, password: hashedPassword });

  // Generate a JWT so the user is immediately logged in after registering
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Return only safe fields (never return the password)
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Login an existing user.
 * 1. Find user by email.
 * 2. Compare password with stored hash.
 * 3. Return a signed JWT.
 */
const login = async ({ email, password }) => {
  // Find the user (includes password field for comparison)
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // bcrypt.compare checks if plain text matches the stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Sign the token
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Get the current logged-in user's profile.
 */
const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update the current user's profile (name only for now).
 * Password changes require a separate dedicated flow (not in scope here).
 */
const updateMe = async (userId, body) => {
  const { name } = body;

  // Only update fields that were actually provided
  const updateData = {};
  if (name) updateData.name = name.trim();

  const updated = await userRepository.update(userId, updateData);

  // Return only safe fields — never return the password
  return {
    id:        updated.id,
    name:      updated.name,
    email:     updated.email,
    avatar:    updated.avatar,
    role:      updated.role,
    createdAt: updated.createdAt,
  };
};

/**
 * Change the logged-in user's password.
 * Requires the current password to be verified first (security best practice).
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  // findByEmail returns the hashed password; findById does not (for safety)
  // So we fetch the full record here by ID with password included
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify the current password before allowing a change
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  // Hash the new password and save it
  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, { password: hashed });
};

/**
 * Save the Cloudinary avatar URL to the user's record.
 * The URL comes from Multer + Cloudinary after the file is uploaded.
 */
const uploadAvatar = async (userId, avatarUrl) => {
  const updated = await userRepository.update(userId, { avatar: avatarUrl });
  return {
    id:        updated.id,
    name:      updated.name,
    email:     updated.email,
    avatar:    updated.avatar,
    role:      updated.role,
    createdAt: updated.createdAt,
  };
};

module.exports = { register, login, getMe, updateMe, changePassword, uploadAvatar };
