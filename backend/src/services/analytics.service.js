// src/services/analytics.service.js
// Business logic for the Analytics module.
// Transforms raw DB data into chart-ready formats.

const analyticsRepo = require('../repositories/analytics.repository');

/**
 * Spending breakdown by category — used in the Pie/Bar chart.
 * Adds a percentage to each category.
 */
const getSpendingByCategory = async (userId) => {
  const raw   = await analyticsRepo.spendingByCategory(userId);
  const total = raw.reduce((sum, r) => sum + (r._sum.amount || 0), 0);

  return raw.map((r) => ({
    category:   r.category,
    amount:     r._sum.amount || 0,
    // percentage rounded to 1 decimal place
    percentage: total > 0 ? Math.round(((r._sum.amount || 0) / total) * 1000) / 10 : 0,
  }));
};

/**
 * Monthly spending trend for the last 12 months.
 * Groups raw expense rows by "YYYY-MM" key and sums amounts.
 * Returns: [{ month: 'Sep 2025', amount: 3200 }, ...]
 */
const getMonthlyTrend = async (userId) => {
  const expenses = await analyticsRepo.expensesForTrend(userId);

  // Build a map: { '2025-09': 3200, '2025-10': 1500, ... }
  const monthMap = {};
  expenses.forEach(({ date, amount }) => {
    const d   = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + amount;
  });

  // Fill in all 12 months (even empty ones) so the chart has no gaps
  const result = [];
  const now    = new Date();
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month:  d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
      amount: Math.round(monthMap[key] || 0),
    });
  }
  return result;
};

/**
 * Trip breakdown + upcoming trips.
 */
const getTripAnalytics = async (userId) => {
  const [byStatus, destinations, upcoming] = await Promise.all([
    analyticsRepo.tripsByStatus(userId),
    analyticsRepo.topDestinations(userId),
    analyticsRepo.upcomingTrips(userId),
  ]);

  return {
    byStatus:     byStatus.map(s => ({ status: s.status, count: s._count._all })),
    destinations: destinations.map(d => ({ destination: d.destination, count: d._count._all })),
    upcoming,
  };
};

/**
 * Budget vs actual spending per trip.
 * Calculates actual = sum of all expenses for that trip.
 */
const getBudgetVsActual = async (userId) => {
  const trips = await analyticsRepo.budgetVsActual(userId);

  return trips.map((t) => {
    const actual  = t.expenses.reduce((sum, e) => sum + e.amount, 0);
    const budget  = t.budget || 0;
    const overBudget = actual > budget && budget > 0;
    const pct     = budget > 0 ? Math.round((actual / budget) * 100) : 0;
    return {
      id:          t.id,
      title:       t.title,
      destination: t.destination,
      status:      t.status,
      budget:      Math.round(budget),
      actual:      Math.round(actual),
      pct,
      overBudget,
    };
  });
};

/**
 * Summary stats — the top KPI cards.
 */
const getSummary = (userId) => analyticsRepo.getSummaryStats(userId);

/**
 * Full analytics in one call — used by the main AnalyticsPage.
 * Runs all queries in parallel.
 */
const getFullAnalytics = async (userId) => {
  const [summary, spendingByCategory, monthlyTrend, tripAnalytics, budgetVsActual] =
    await Promise.all([
      getSummary(userId),
      getSpendingByCategory(userId),
      getMonthlyTrend(userId),
      getTripAnalytics(userId),
      getBudgetVsActual(userId),
    ]);

  return { summary, spendingByCategory, monthlyTrend, tripAnalytics, budgetVsActual };
};

module.exports = {
  getSpendingByCategory, getMonthlyTrend,
  getTripAnalytics, getBudgetVsActual,
  getSummary, getFullAnalytics,
};
