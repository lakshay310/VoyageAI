// src/controllers/dashboard.controller.js
// Thin controller — just reads req.user, calls the service, sends the response.

const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/dashboard
 * Returns all stats and recent activity for the logged-in user's dashboard.
 * Protected: the protect middleware sets req.user before this runs.
 */
const getDashboard = async (req, res, next) => {
  try {
    // req.user.id is set by the protect middleware after verifying the JWT
    const data = await dashboardService.getDashboardSummary(req.user.id);
    return sendSuccess(res, 'Dashboard data fetched.', data);
  } catch (error) {
    next(error); // passes to the global error handler in app.js
  }
};

module.exports = { getDashboard };
