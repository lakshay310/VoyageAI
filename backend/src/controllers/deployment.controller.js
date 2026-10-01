// src/controllers/deployment.controller.js
// Handles HTTP requests for deployment-related endpoints.
// Thin layer: delegates to service, sends response.

const deploymentService = require('../services/deployment.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/deployment/status
 * Returns a full deployment readiness report.
 * Protected: ADMIN only (enforced in deployment.routes.js).
 */
const getStatus = async (req, res, next) => {
  try {
    const report = await deploymentService.getDeploymentStatus();

    // sendSuccess(res, message, data, statusCode)
    // Even when some checks fail, we return HTTP 200 so the response body
    // is always readable. The "status" field inside the JSON tells whether
    // everything is OK or degraded.
    return sendSuccess(res, 'Deployment status retrieved successfully.', report);
  } catch (err) {
    next(err); // pass to global error handler like every other controller
  }
};

module.exports = { getStatus };
