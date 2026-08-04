// src/services/ai.service.js
// API calls for the AI-powered features.

import api from './api';

/**
 * Generate a full trip itinerary.
 * @param {object} data - { destination, days, budget, travelStyle, interests }
 */
export const generateItinerary = (data) => api.post('/ai/generate', data);

/**
 * Send a message to the AI travel chatbot.
 *
 * The frontend manages the conversation history locally (in React state)
 * and sends the full history on every request. This keeps the server stateless
 * — no DB table needed for chat history.
 *
 * @param {string} message  - The user's latest message
 * @param {Array}  history  - All previous turns: [{ role: 'user'|'model', text: string }]
 */
export const chatWithBot = (message, history) =>
  api.post('/ai/chat', { message, history });

