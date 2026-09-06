// src/repositories/analytics.repository.js
// Data-access layer for the Analytics module.
// All queries are scoped to the logged-in user's data.

const prisma = require('../config/database');

// ── Spending analytics ────────────────────────────────────────────────────────

/**
 * Total spending grouped by expense category.
 * Returns: [{ category: 'FOOD', _sum: { amount: 1200 } }, ...]
 */
const spendingByCategory = (userId) =>
  prisma.expense.groupBy({
    by: ['category'],
    where: { trip: { userId } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

/**
 * Monthly spending trend for the past 12 months.
 * We fetch all expenses with their dates and group them in JS
 * because Prisma doesn't support date_trunc groupBy natively.
 * Returns raw expenses: [{ date, amount }]
 */
const expensesForTrend = (userId) =>
  prisma.expense.findMany({
    where: {
      trip: { userId },
      date: {
        // Only last 12 months
        gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    },
    select: { date: true, amount: true },
    orderBy: { date: 'asc' },
  });

// ── Trip analytics ────────────────────────────────────────────────────────────

/**
 * Trip count grouped by status.
 */
const tripsByStatus = (userId) =>
  prisma.trip.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  });

/**
 * Top 5 destinations (most frequent trips to same destination).
 */
const topDestinations = (userId) =>
  prisma.trip.groupBy({
    by: ['destination'],
    where: { userId },
    _count: { _all: true },
    orderBy: { _count: { destination: 'desc' } },
    take: 5,
  });

/**
 * Upcoming trips (startDate in the future).
 */
const upcomingTrips = (userId) =>
  prisma.trip.findMany({
    where: { userId, startDate: { gt: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 5,
    select: {
      id: true, title: true, destination: true,
      startDate: true, endDate: true, status: true, budget: true,
    },
  });

// ── Budget analytics ──────────────────────────────────────────────────────────

/**
 * Budget vs actual spending per trip.
 * Returns trips with their total expense sum.
 */
const budgetVsActual = (userId) =>
  prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true, title: true, destination: true,
      budget: true, status: true,
      expenses: {
        select: { amount: true },
      },
    },
  });

// ── Summary stats ─────────────────────────────────────────────────────────────

/**
 * All summary numbers in one batch.
 */
const getSummaryStats = async (userId) => {
  const [
    totalTrips,
    completedTrips,
    totalBookings,
    expenseTotal,
    reviewCount,
    wishlistCount,
    journalCount,
  ] = await Promise.all([
    prisma.trip.count({ where: { userId } }),
    prisma.trip.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.booking.count({ where: { userId } }),
    prisma.expense.aggregate({
      where: { trip: { userId } },
      _sum: { amount: true },
    }),
    prisma.review.count({ where: { userId } }),
    prisma.wishlist.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { trip: { userId } } }),
  ]);

  return {
    totalTrips,
    completedTrips,
    totalBookings,
    totalSpent: expenseTotal._sum.amount || 0,
    reviewCount,
    wishlistCount,
    journalCount,
  };
};

module.exports = {
  spendingByCategory, expensesForTrend,
  tripsByStatus, topDestinations, upcomingTrips,
  budgetVsActual, getSummaryStats,
};
