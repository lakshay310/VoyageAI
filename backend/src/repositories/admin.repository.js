// src/repositories/admin.repository.js
// Data-access layer for the Admin Dashboard.
// All queries are platform-wide (no userId filter) — admins see everything across the platform.

const prisma = require('../config/database');

// ── Platform-wide counts & totals ─────────────────────────────────────────────

/** Total registered users count */
const countUsers = () => prisma.user.count();

/** Total trips planned across the entire app */
const countTrips = () => prisma.trip.count();

/** Total bookings made across the entire app */
const countBookings = () => prisma.booking.count();

/** Total confirmed bookings */
const countConfirmedBookings = () =>
  prisma.booking.count({ where: { status: 'CONFIRMED' } });

/** Total platform revenue (sum of all CONFIRMED booking amounts) */
const sumRevenue = () =>
  prisma.booking.aggregate({
    where: { status: 'CONFIRMED' },
    _sum: { amount: true },
  });

/** Total reviews submitted across all services */
const countReviews = () => prisma.review.count();

// ── Aggregations & Breakdowns ──────────────────────────────────────────────────

/** Group trips by status (PLANNED, ONGOING, COMPLETED, CANCELLED) */
const tripsByStatus = () =>
  prisma.trip.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

/** Group bookings by type (FLIGHT, HOTEL, CAR, ACTIVITY) */
const bookingsByType = () =>
  prisma.booking.groupBy({
    by: ['type'],
    _count: { _all: true },
  });

// ── Recent activity feeds ──────────────────────────────────────────────────────

/** Get the latest N registered users */
const getRecentUsers = (limit = 6) =>
  prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

/** Get the latest N bookings with user and trip info */
const getRecentBookings = (limit = 6) =>
  prisma.booking.findMany({
    orderBy: { bookedAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
      trip: { select: { id: true, title: true, destination: true } },
    },
  });

// ── User management ────────────────────────────────────────────────────────────

/**
 * Get paginated list of users with counts of their trips, bookings, and reviews.
 */
const getAllUsers = (skip = 0, take = 10) =>
  prisma.user.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          trips: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

/** Count all users for pagination */
const countAllUsers = () => prisma.user.count();

/** Find single user by ID */
const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });

/** Update a user's role (ADMIN or USER) */
const updateUserRole = (id, role) =>
  prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

/** Delete user permanently (cascades related trips, bookings, reviews via schema) */
const deleteUser = (id) =>
  prisma.user.delete({
    where: { id },
  });

module.exports = {
  countUsers,
  countTrips,
  countBookings,
  countConfirmedBookings,
  sumRevenue,
  countReviews,
  tripsByStatus,
  bookingsByType,
  getRecentUsers,
  getRecentBookings,
  getAllUsers,
  countAllUsers,
  findUserById,
  updateUserRole,
  deleteUser,
};
