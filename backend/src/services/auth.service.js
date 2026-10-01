// src/services/auth.service.js
// Business logic for authentication.
// Controllers call these functions; this layer never touches HTTP (req/res).

const bcrypt              = require('bcryptjs');
const AppError            = require('../utils/AppError');
const userRepository      = require('../repositories/user.repository');
const { generateToken }   = require('../utils/jwt');
const notificationService = require('./notification.service');

/**
 * Return only safe (non-sensitive) user fields.
 * Never expose the password hash to the outside world.
 * Used by updateMe and uploadAvatar to keep the return shape consistent.
 *
 * @param {object} user - Full Prisma user record
 * @returns {{ id, name, email, avatar, role, createdAt }}
 */
const toSafeUser = (user) => ({
  id:        user.id,
  name:      user.name,
  email:     user.email,
  avatar:    user.avatar,
  role:      user.role,
  createdAt: user.createdAt,
});

/**
 * Register a new user.
 * 1. Check if email already taken.
 * 2. Hash the password.
 * 3. Save user to DB.
 * 4. Return a signed JWT.
 */
const register = async ({ name, email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // bcrypt.hash(password, saltRounds) — 10 is the recommended cost factor
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({ name, email, password: hashedPassword });

  // Sign a JWT so the user is immediately logged in after registering
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // 🔔 Send a welcome notification (non-blocking — doesn't delay registration response)
  setImmediate(() => {
    notificationService.createAndEmit(user.id, {
      title:   `Welcome to VoyageAI, ${user.name.split(' ')[0]}! 👋`,
      message: 'Start planning your first trip by clicking "My Trips" in the sidebar.',
      type:    'WELCOME',
      link:    '/trips',
    }).catch(console.error);
  });

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
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/** Get the current logged-in user's profile. */
const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return user;
};

/**
 * Update the current user's profile (name only).
 * Password changes require the separate changePassword flow.
 */
const updateMe = async (userId, body) => {
  const updateData = {};
  if (body.name) updateData.name = body.name.trim();

  const updated = await userRepository.update(userId, updateData);

  // Use the shared helper — never return the password hash
  return toSafeUser(updated);
};

/**
 * Change the logged-in user's password.
 * Requires the current password to be verified first (security best practice).
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  // findByIdWithPassword returns ALL fields including the hash — only for internal use
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, { password: hashed });
};

/**
 * Save the Cloudinary avatar URL to the user's record.
 * The URL comes from Multer + Cloudinary after the file is uploaded.
 */
const uploadAvatar = async (userId, avatarUrl) => {
  const updated = await userRepository.update(userId, { avatar: avatarUrl });
  return toSafeUser(updated); // shared helper — consistent shape, no password
};

module.exports = { register, login, getMe, updateMe, changePassword, uploadAvatar };
