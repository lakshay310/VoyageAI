// src/services/search.service.js
// Business logic for the Search, Filter & Pagination module.
// Validates query params and delegates to the repository.

const AppError    = require('../utils/AppError');
const searchRepo  = require('../repositories/search.repository');

/** Global search across all categories. */
const globalSearch = async (userId, q) => {
  if (!q || !q.trim()) {
    throw new AppError('Search query is required.', 400);
  }
  return searchRepo.globalSearch(userId, q.trim());
};

/** Search hotels with filters. */
const searchHotels = async (filters, page, limit) => {
  return searchRepo.searchHotels(filters, page, limit);
};

/** Search flights with filters. */
const searchFlights = async (filters, page, limit) => {
  return searchRepo.searchFlights(filters, page, limit);
};

/** Search trips with filters (user-scoped). */
const searchTrips = async (userId, filters, page, limit) => {
  return searchRepo.searchTrips(userId, filters, page, limit);
};

/** Search wishlist with filters (user-scoped). */
const searchWishlist = async (userId, filters, page, limit) => {
  return searchRepo.searchWishlist(userId, filters, page, limit);
};

module.exports = { globalSearch, searchHotels, searchFlights, searchTrips, searchWishlist };
