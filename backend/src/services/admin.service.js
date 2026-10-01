// src/services/admin.service.js
// Business logic for the Admin Dashboard module.
// Runs all platform-wide queries and formats the response for the frontend.

const AppError    = require('../utils/AppError');
const adminRepo   = require('../repositories/admin.repository');

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
 * Get paginated list of all users with trip, booking, and review counts.
 * The admin repo getAllUsers has a custom select (richer than a generic findMany),
 * so we use it directly but apply the paginate utility's math to avoid duplication.
 */
const getAllUsers = async (page = 1, limit = 10) => {
  const currentPage  = Math.max(1, parseInt(page)  || 1);
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
 * Security Guard: requesting admin cannot change their own role (prevents self-lockout).
 */
const updateUserRole = async (requestingAdminId, targetUserId, newRole) => {
  if (requestingAdminId === targetUserId) {
    throw new AppError('You cannot change your own role.', 400);
  }

  if (!['ADMIN', 'USER'].includes(newRole)) {
    throw new AppError('Role must be ADMIN or USER.', 400);
  }

  const existingUser = await adminRepo.findUserById(targetUserId);
  if (!existingUser) {
    throw new AppError('User not found.', 404);
  }

  return adminRepo.updateUserRole(targetUserId, newRole);
};

/**
 * Delete a user and cascade their records.
 * Security Guard: requesting admin cannot delete their own account from the admin dashboard.
 */
const deleteUser = async (requestingAdminId, targetUserId) => {
  if (requestingAdminId === targetUserId) {
    throw new AppError('You cannot delete your own account from the admin panel.', 400);
  }

  const existingUser = await adminRepo.findUserById(targetUserId);
  if (!existingUser) {
    throw new AppError('User not found.', 404);
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
