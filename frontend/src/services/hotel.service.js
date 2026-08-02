// src/services/hotel.service.js
// Frontend API wrapper for hotel search and booking.
// Uses the pre-configured axios `api` instance (handles base URL + auth token).

import api from './api';

/** Search hotels with filters */
export const searchHotels  = (params) => api.post('/hotels/search', params);

/** Get popular/featured hotels for landing chips */
export const getPopularHotels = () => api.get('/hotels/popular');

/** Get a single hotel by ID (used by the detail modal) */
export const getHotelById = (id) => api.get(`/hotels/${id}`);

/** Book a hotel and attach to a trip */
export const bookHotel = (bookingData) => api.post('/hotels/book', bookingData);
