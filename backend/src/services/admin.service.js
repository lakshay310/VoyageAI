// src/services/admin.service.js
// Business logic for the Admin Dashboard module.
// Runs all platform-wide queries and formats the response for the frontend.

const adminRepo = require('../repositories/admin.repository');

/**
 * Gather all platform stats in one shot (runs queries in parallel).
 * Powers the KPI cards and breakdowns at the top of the admin dashboard.
 */
const getPlatformStats = async () => {
  const [
    totalUsers,
    totalTrips,
    totalBookings,
    confirmedBookings,
    revenueData,
    totalReviews,
    tripsByStatus,
    bookingsByType,
  ] = await Promise.all([
    adminRepo.countUsers(),
    adminRepo.countTrips(),
    adminRepo.countBookings(),
    adminRepo.countConfirmedBookings(),
    adminRepo.sumRevenue(),
    adminRepo.countReviews(),
    adminRepo.tripsByStatus(),
    adminRepo.bookingsByType(),
  ]);

  return {
    totalUsers,
    totalTrips,
    totalBookings,
    confirmedBookings,
    totalRevenue: revenueData?._sum?.amount || 0,
    totalReviews,
    tripsByStatus,
    bookingsByType,
  };
};

/**
 * Get dashboard overview:
 * Platform stats + recent signups + recent bookings in a single call.
 */
const getDashboardOverview = async () => {
  const [stats, recentUsers, recentBookings] = await Promise.all([
    getPlatformStats(),
    adminRepo.getRecentUsers(6),
    adminRepo.getRecentBookings(6),
  ]);

  return { stats, recentUsers, recentBookings };
};

/**
 * Get paginated list of all users with trip counts.
 */
const getAllUsers = async (page = 1, limit = 10) => {
  const currentPage  = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip         = (currentPage - 1) * itemsPerPage;

  const [data, totalCount] = await Promise.all([
    adminRepo.getAllUsers(skip, itemsPerPage),
    adminRepo.countAllUsers(),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    data,
    meta: {
      page:        currentPage,
      limit:       itemsPerPage,
      totalCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
};

/**
 * Change a user's role to ADMIN or USER.
 * Security Guard: Requesting admin cannot change their own role (prevents self-lockout).
 */
const updateUserRole = async (requestingAdminId, targetUserId, newRole) => {
  if (requestingAdminId === targetUserId) {
    const error = new Error('You cannot change your own role.');
    error.statusCode = 400;
    throw error;
  }

  if (!['ADMIN', 'USER'].includes(newRole)) {
    const error = new Error('Role must be ADMIN or USER.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await adminRepo.findUserById(targetUserId);
  if (!existingUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return adminRepo.updateUserRole(targetUserId, newRole);
};

/**
 * Delete a user and cascade their records.
 * Security Guard: Requesting admin cannot delete their own account from the admin dashboard.
 */
const deleteUser = async (requestingAdminId, targetUserId) => {
  if (requestingAdminId === targetUserId) {
    const error = new Error('You cannot delete your own account from the admin panel.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await adminRepo.findUserById(targetUserId);
  if (!existingUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return adminRepo.deleteUser(targetUserId);
};

module.exports = {
  getPlatformStats,
  getDashboardOverview,
  getAllUsers,
  updateUserRole,
  deleteUser,
};
