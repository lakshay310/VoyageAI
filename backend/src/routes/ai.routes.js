// src/routes/ai.routes.js
// AI endpoints:
//   POST /api/ai/generate  → Generate full trip itinerary (AI Planner page)
//   POST /api/ai/chat      → Free-form travel chatbot (AI Chat page)
//
// Flow: Route → Validator → Controller → Service → Gemini API

const express = require('express');
const router  = express.Router();

const aiController = require('../controllers/ai.controller');
const { protect }  = require('../middlewares/auth.middleware');
const { generateValidator, chatValidator } = require('../validators/ai.validator');
const validate = require('../middlewares/validate.middleware');

// POST /api/ai/generate
// Must be logged in — we don't want public access to our AI quota
router.post('/generate', protect, generateValidator, validate, aiController.generateItinerary);

// POST /api/ai/chat
// Stateless chatbot — client sends full history; server returns next reply
router.post('/chat', protect, chatValidator, validate, aiController.chatWithBot);

module.exports = router;

