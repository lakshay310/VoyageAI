// src/controllers/ai.controller.js
// Thin HTTP wrapper — reads the request body, calls the AI service,
// and returns the generated itinerary + currency info.

const aiService = require('../services/ai.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/ai/generate
 * Accepts trip preferences and returns an AI-generated itinerary
 * along with currency conversion info for the destination.
 *
 * Request body:
 *   { destination, days, budget, travelStyle, interests }
 */
const generateItinerary = async (req, res, next) => {
  try {
    const { destination, days, budget, travelStyle, interests } = req.body;

    // Generate the itinerary via the AI service.
    // The service now returns { itinerary, currency } — not just a string.
    const result = await aiService.generateItinerary({
      destination,
      days:        parseInt(days, 10),
      budget:      parseInt(budget, 10),
      travelStyle: travelStyle || 'balanced',
      interests:   interests   || 'culture, food, sightseeing',
    });

    // Send both itinerary text and currency info back to frontend
    return sendSuccess(res, 'Itinerary generated successfully!', {
      itinerary: result.itinerary,
      currency:  result.currency,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateItinerary };
