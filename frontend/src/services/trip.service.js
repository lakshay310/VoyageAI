// src/services/trip.service.js
// All API calls related to trips (destinations).
// Each function maps to one backend REST endpoint.

import api from './api';

/** Fetch all trips for the logged-in user */
export const getMyTrips = () => api.get('/trips');

/** Fetch a single trip by ID (includes bookings + expenses) */
export const getTripById = (id) => api.get(`/trips/${id}`);

/** Create a new trip */
export const createTrip = (data) => api.post('/trips', data);

/** Update an existing trip (partial update — only send changed fields) */
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data);

/** Delete a trip and all its bookings/expenses */
export const deleteTrip = (id) => api.delete(`/trips/${id}`);
