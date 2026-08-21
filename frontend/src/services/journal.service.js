// src/services/journal.service.js
// Frontend API wrapper for all Travel Journal endpoints.
// Uses the shared axios instance which auto-attaches the JWT.

import api from './api';

/** Get ALL journal entries for the logged-in user (across all trips) */
export const getAllEntries = () => api.get('/journal');

/** Get all journal entries for a specific trip */
export const getTripEntries = (tripId) => api.get(`/journal/trip/${tripId}`);

/** Get a single journal entry by ID */
export const getEntry = (id) => api.get(`/journal/${id}`);

/** Create a new journal entry for a trip */
export const createEntry = (tripId, data) => api.post(`/journal/trip/${tripId}`, data);

/** Update a journal entry */
export const updateEntry = (id, data) => api.patch(`/journal/${id}`, data);

/** Delete a journal entry */
export const deleteEntry = (id) => api.delete(`/journal/${id}`);
