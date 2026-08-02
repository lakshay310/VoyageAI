// src/services/dashboard.service.js
// Gathers all the data needed for the dashboard in one call.
// Runs all Prisma queries in PARALLEL using Promise.all for speed.

const dashboardRepository = require('../repositories/dashboard.repository');

/**
 * Build the complete dashboard summary for a user.
 *
 * Why Promise.all?
 * Each query is independent — running them sequentially would take 5x longer.
 * Promise.all fires all 5 at the same time and waits for all to finish.
 */
const getDashboardSummary = async (userId) => {
  // Fire all queries simultaneously
  const [
    tripCount,
    activeBookingCount,
    expenseSum,
    recentTrips,
    recentExpenses,
  ] = await Promise.all([
    dashboardRepository.countTrips(userId),
    dashboardRepository.countActiveBookings(userId),
    dashboardRepository.sumTotalExpenses(userId),
    dashboardRepository.getRecentTrips(userId),
    dashboardRepository.getRecentExpenses(userId),
  ]);

  // expenseSum._sum.amount is null if there are no expenses yet — default to 0
  const totalSpent = expenseSum._sum.amount ?? 0;

  return {
    stats: {
      totalTrips:      tripCount,
      activeBookings:  activeBookingCount,
      totalSpent,        // total ₹ spent across all trips
    },
    recentTrips,
    recentExpenses,
  };
};

module.exports = { getDashboardSummary };
