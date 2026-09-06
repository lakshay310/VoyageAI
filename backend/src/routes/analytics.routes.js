// src/routes/analytics.routes.js
// Express router for the Analytics module.
// All routes require a valid JWT — data is always scoped to req.user.id.

const express              = require('express');
const router               = express.Router();
const { protect }          = require('../middlewares/auth.middleware');
const analyticsController  = require('../controllers/analytics.controller');

// All analytics routes need to be logged in
router.use(protect);

// GET /api/analytics          → full analytics (all sections in one call)
router.get('/',         analyticsController.getFullAnalytics);

// GET /api/analytics/summary  → KPI numbers only
router.get('/summary',  analyticsController.getSummary);

// GET /api/analytics/spending → spending by category + monthly trend
router.get('/spending', analyticsController.getSpending);

// GET /api/analytics/trips    → trip breakdown + upcoming
router.get('/trips',    analyticsController.getTripAnalytics);

// GET /api/analytics/budget   → budget vs actual per trip
router.get('/budget',   analyticsController.getBudgetAnalytics);

module.exports = router;
