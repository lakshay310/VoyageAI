// src/routes/dashboard.routes.js
// Defines the /api/dashboard endpoint.
// Flow: Route -> Controller -> Service -> Repository -> Prisma

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');

// GET /api/dashboard
// Must be logged in (protect middleware checks the JWT)
router.get('/', protect, dashboardController.getDashboard);

module.exports = router;
