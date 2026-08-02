// src/routes/ai.routes.js
// Single endpoint: POST /api/ai/generate
// Flow: Route → Validator → Controller → Service → Gemini API

const express = require('express');
const router  = express.Router();

const aiController = require('../controllers/ai.controller');
const { protect }  = require('../middlewares/auth.middleware');
const { generateValidator } = require('../validators/ai.validator');
const validate = require('../middlewares/validate.middleware');

// POST /api/ai/generate
// Must be logged in — we don't want public access to our AI quota
router.post('/generate', protect, generateValidator, validate, aiController.generateItinerary);

module.exports = router;
