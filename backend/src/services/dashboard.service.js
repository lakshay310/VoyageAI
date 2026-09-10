// src/services/dashboard.service.js
// Gathers all the data needed for the dashboard in one call.
// Runs all Prisma queries in PARALLEL using Promise.all for speed.
// Prompt 26: Results are cached for 60 seconds to reduce DB load.

const dashboardRepository = require('../repositories/dashboard.repository');
const cache               = require('../utils/cache'); // Prompt 26: in-memory cache

/**
 * Build the complete dashboard summary for a user.
 *
 * Why Promise.all?
 * Each query is independent — running them sequentially would take 5x longer.
 * Promise.all fires all 5 at the same time and waits for all to finish.
 *
 * Why cache?
 * Dashboard data changes rarely within a 60-second window.
 * Caching means repeated refreshes hit memory (microseconds) not Postgres (milliseconds).
 */
const getDashboardSummary = async (userId) => {
  // Build a cache key scoped to this specific user
  const cacheKey = `dashboard:${userId}`;

  // Return cached result if it's still fresh (within 60 seconds)
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Cache miss — run all DB queries in parallel
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

  const result = {
    stats: {
      totalTrips:     tripCount,
      activeBookings: activeBookingCount,
      totalSpent,     // total ₹ spent across all trips
    },
    recentTrips,
    recentExpenses,
  };

  // Store result in cache for 60 seconds
  cache.set(cacheKey, result, 60);

  return result;
};

/**
 * Call this after any write operation (create/update/delete trip, expense, booking)
 * to invalidate the cached dashboard so the next read gets fresh data.
 * @param {string} userId
 */
const invalidateDashboardCache = (userId) => {
  cache.del(`dashboard:${userId}`);
};

module.exports = { getDashboardSummary, invalidateDashboardCache };
