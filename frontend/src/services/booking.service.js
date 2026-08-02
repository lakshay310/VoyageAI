// src/services/booking.service.js
// Frontend API wrapper for the Booking module.
// Uses the pre-configured axios `api` instance (handles base URL + auth token).

import api from './api';

/** Get all bookings for the logged-in user. Supports query filters: type, status, search */
export const getUserBookings = (params) => api.get('/bookings', { params });

/** Get all bookings under a specific trip (used in trip detail view) */
export const getTripBookings  = (tripId) => api.get(`/trips/${tripId}/bookings`);

/** Get a single booking by its ID */
export const getBookingById   = (id) => api.get(`/bookings/${id}`);

/** Manually create a booking under a trip */
export const createBooking    = (tripId, data) => api.post(`/trips/${tripId}/bookings`, data);

/** Update a booking (e.g., change status, edit reference code) */
export const updateBooking    = (id, data) => api.put(`/bookings/${id}`, data);

/** Delete / cancel a booking */
export const deleteBooking    = (id) => api.delete(`/bookings/${id}`);
