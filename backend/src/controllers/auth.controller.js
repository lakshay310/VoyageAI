// src/controllers/auth.controller.js
// Handles HTTP: reads req, calls the service, sends the response.
// Controllers should be thin — no business logic here.

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/auth/register
 * Register a new user account.
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'Account created successfully!', result, 201);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * POST /api/auth/login
 * Login with email and password.
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, 'Logged in successfully!', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get the current logged-in user's profile.
 * Requires the protect middleware to run first.
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware after verifying the JWT
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, 'User profile fetched.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/me
 * Update the logged-in user's profile (name).
 */
const updateMe = async (req, res, next) => {
  try {
    const updated = await authService.updateMe(req.user.id, req.body);
    return sendSuccess(res, 'Profile updated successfully.', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/password
 * Change the logged-in user's password.
 * Requires current password for verification.
 */
const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/avatar
 * Upload a profile picture.
 * Multer processes the file and Cloudinary returns a URL via req.file.path.
 */
const uploadAvatar = async (req, res, next) => {
  try {
    // req.file is populated by Multer after a successful upload
    if (!req.file) {
      return sendError(res, 'No image file was provided.', 400);
    }

    // Cloudinary returns the public URL in req.file.path
    const updated = await authService.uploadAvatar(req.user.id, req.file.path);
    return sendSuccess(res, 'Avatar updated successfully.', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe, changePassword, uploadAvatar };
