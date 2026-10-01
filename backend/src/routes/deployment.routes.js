// src/routes/deployment.routes.js
// REST endpoints for deployment readiness checks.
// Only admins can call these — they expose server internals.
//
// Routes:
//   GET /api/deployment/status   — full readiness report (ADMIN only)

const express    = require('express');
const { protect, authorise } = require('../middlewares/auth.middleware');
const { getStatus } = require('../controllers/deployment.controller');

const router = express.Router();

// GET /api/deployment/status
// protect     → must be logged in (valid JWT)
// authorise   → must have ADMIN role
router.get('/status', protect, authorise('ADMIN'), getStatus);

module.exports = router;
