// src/controllers/analytics.controller.js
// HTTP handlers for the Analytics module.
// All routes require a valid JWT (logged-in user).

const analyticsService = require('../services/analytics.service');
const { sendSuccess }  = require('../utils/response');

/**
 * GET /api/analytics
 * Full analytics in a single request — powers the main AnalyticsPage.
 */
const getFullAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getFullAnalytics(req.user.id);
    return sendSuccess(res, 'Analytics fetched.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/summary
 * Just the KPI summary cards — lightweight for quick refresh.
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getSummary(req.user.id);
    return sendSuccess(res, 'Summary fetched.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/spending
 * Spending by category + monthly trend.
 */
const getSpending = async (req, res, next) => {
  try {
    const [byCategory, monthly] = await Promise.all([
      analyticsService.getSpendingByCategory(req.user.id),
      analyticsService.getMonthlyTrend(req.user.id),
    ]);
    return sendSuccess(res, 'Spending analytics fetched.', { byCategory, monthly });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/trips
 * Trip breakdown + upcoming trips.
 */
const getTripAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getTripAnalytics(req.user.id);
    return sendSuccess(res, 'Trip analytics fetched.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/budget
 * Budget vs actual per trip.
 */
const getBudgetAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getBudgetVsActual(req.user.id);
    return sendSuccess(res, 'Budget analytics fetched.', data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getFullAnalytics, getSummary, getSpending, getTripAnalytics, getBudgetAnalytics };
