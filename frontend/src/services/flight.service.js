// src/services/flight.service.js
// Frontend API wrapper for flight search and bookings.

import api from './api';

/** Search flights with filters */
export const searchFlights = (params) => api.post('/flights/search', params);

/** Fetch popular routes for quick chips */
export const getPopularRoutes = () => api.get('/flights/popular');

/** Book a flight and attach to a user's trip */
export const bookFlight = (bookingData) => api.post('/flights/book', bookingData);
