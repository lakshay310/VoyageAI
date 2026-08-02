// src/services/ai.service.js
// Sends trip preferences to the backend AI endpoint.

import api from './api';

/**
 * Generate an AI itinerary.
 * @param {object} data - { destination, days, budget, travelStyle, interests }
 */
export const generateItinerary = (data) => api.post('/ai/generate', data);
