// src/repositories/dashboard.repository.js
// All Prisma queries needed to build the dashboard summary.
// We keep these separate so the dashboard service stays clean.

const prisma = require('../config/database');

/**
 * Count how many trips the user has in total.
 */
const countTrips = (userId) => {
  return prisma.trip.count({ where: { userId } });
};

/**
 * Count the user's bookings that are currently CONFIRMED.
 * A booking is "active" if its status is CONFIRMED (not CANCELLED).
 */
const countActiveBookings = (userId) => {
  return prisma.booking.count({
    where: { userId, status: 'CONFIRMED' },
  });
};

/**
 * Sum up ALL expenses the user has logged across all their trips.
 * Returns: { _sum: { amount: <number or null> } }
 */
const sumTotalExpenses = (userId) => {
  return prisma.expense.aggregate({
    where: { trip: { userId } }, // only expenses belonging to the user's trips
    _sum: { amount: true },
  });
};

/**
 * Get the 3 most recently created trips (for the "Recent Trips" widget).
 */
const getRecentTrips = (userId) => {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3, // only fetch 3 rows
    select: {
      id:          true,
      destination: true,
      status:      true,
      startDate:   true,
      endDate:     true,
      budget:      true,
    },
  });
};

/**
 * Get the 5 most recent expenses across all of the user's trips.
 * Includes the trip name so we can show "Paris Trip > ₹800 on Food".
 */
const getRecentExpenses = (userId) => {
  return prisma.expense.findMany({
    where: { trip: { userId } },
    orderBy: { date: 'desc' },
    take: 5,
    select: {
      id:          true,
      title:       true,
      amount:      true,
      category:    true,
      date:        true,
      trip: {
        select: { destination: true }, // join the trip table for the destination name
      },
    },
  });
};

module.exports = {
  countTrips,
  countActiveBookings,
  sumTotalExpenses,
  getRecentTrips,
  getRecentExpenses,
};
