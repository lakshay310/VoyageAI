// src/controllers/admin.controller.js
// HTTP handlers for the Admin Dashboard module.
// All handlers execute after `protect` and `authorise('ADMIN')` middlewares.

const adminService    = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/admin/overview
 * Returns platform stats, recent users, and recent bookings.
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardOverview();
    return sendSuccess(res, 'Admin overview fetched successfully.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Returns high-level platform KPI statistics.
 */
const getStats = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformStats();
    return sendSuccess(res, 'Platform statistics fetched successfully.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * Returns paginated user list.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await adminService.getAllUsers(page, limit);
    return sendSuccess(res, 'Users fetched successfully.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Updates a user's role (ADMIN or USER).
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id }   = req.params;
    const { role } = req.body;
    const updatedUser = await adminService.updateUserRole(req.user.id, id, role);
    return sendSuccess(res, `User role updated to ${role}.`, updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes a user from the platform.
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(req.user.id, id);
    return sendSuccess(res, 'User deleted successfully.', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
