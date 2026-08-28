// src/services/search.service.js
// Frontend API wrappers for all Search endpoints.
// All params are passed as query strings in GET requests.

import api from './api';

/** Global search across all categories */
export const globalSearch = (q) =>
  api.get('/search', { params: { q } });

/** Search hotels with filters + pagination */
export const searchHotels = (params) =>
  api.get('/search/hotels', { params });

/** Search flights with filters + pagination */
export const searchFlights = (params) =>
  api.get('/search/flights', { params });

/** Search user's trips with filters + pagination */
export const searchTrips = (params) =>
  api.get('/search/trips', { params });

/** Search user's wishlist with filters + pagination */
export const searchWishlist = (params) =>
  api.get('/search/wishlist', { params });
