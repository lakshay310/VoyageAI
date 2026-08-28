// src/controllers/search.controller.js
// HTTP handlers for the Search, Filter & Pagination module.
// All query params come from req.query (GET request URL params).
// Example: GET /api/search/hotels?q=mumbai&starRating=5&page=2&limit=10

const searchService = require('../services/search.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/search?q=
 * Global search across hotels, flights, trips, and wishlist.
 * Returns top 5 results per category (no pagination on global).
 */
const global = async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await searchService.globalSearch(req.user.id, q);
    return sendSuccess(res, 'Search results.', results);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/search/hotels?q=&city=&minPrice=&maxPrice=&starRating=&roomType=&page=&limit=
 * Paginated, filtered hotel search.
 */
const hotels = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await searchService.searchHotels(filters, page, limit);
    return sendSuccess(res, 'Hotels found.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/search/flights?q=&fromCity=&toCity=&stops=&maxPrice=&cabinClass=&page=&limit=
 * Paginated, filtered flight search.
 */
const flights = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await searchService.searchFlights(filters, page, limit);
    return sendSuccess(res, 'Flights found.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/search/trips?q=&status=&page=&limit=
 * Paginated search through the user's own trips.
 */
const trips = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await searchService.searchTrips(req.user.id, filters, page, limit);
    return sendSuccess(res, 'Trips found.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/search/wishlist?q=&category=&visited=&page=&limit=
 * Paginated search through the user's wishlist.
 */
const wishlist = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await searchService.searchWishlist(req.user.id, filters, page, limit);
    return sendSuccess(res, 'Wishlist found.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { global, hotels, flights, trips, wishlist };
