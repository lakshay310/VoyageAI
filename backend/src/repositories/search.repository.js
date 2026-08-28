// src/repositories/search.repository.js
// Data-access layer for the unified Search module.
// Each function searches one resource type with filters + pagination.

const prisma    = require('../config/database');
const paginate  = require('../utils/paginate');

/**
 * Search HOTELS with optional filters.
 * Supports: keyword (name, city, country), city, minPrice, maxPrice, starRating, roomType
 */
const searchHotels = async (filters, page, limit) => {
  const { q, city, minPrice, maxPrice, starRating, roomType } = filters;

  const where = {
    // AND combines all active filters
    AND: [
      // Keyword search: match name, city, or country
      q ? {
        OR: [
          { name:    { contains: q, mode: 'insensitive' } },
          { city:    { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      } : {},
      city        ? { city:        { contains: city, mode: 'insensitive' } } : {},
      starRating  ? { starRating:  parseInt(starRating)  } : {},
      roomType    ? { roomType:    { contains: roomType, mode: 'insensitive' } } : {},
      minPrice    ? { pricePerNight: { gte: parseFloat(minPrice) } } : {},
      maxPrice    ? { pricePerNight: { lte: parseFloat(maxPrice) } } : {},
    ].filter(Boolean),
  };

  // Sort by rating descending (best hotels first)
  return paginate(prisma.hotel, where, { rating: 'desc' }, page, limit);
};

/**
 * Search FLIGHTS with optional filters.
 * Supports: keyword (airline, city), fromCity, toCity, stops, maxPrice, cabinClass
 */
const searchFlights = async (filters, page, limit) => {
  const { q, fromCity, toCity, stops, maxPrice, cabinClass } = filters;

  const where = {
    AND: [
      q ? {
        OR: [
          { airline:  { contains: q, mode: 'insensitive' } },
          { fromCity: { contains: q, mode: 'insensitive' } },
          { toCity:   { contains: q, mode: 'insensitive' } },
          { fromCode: { contains: q, mode: 'insensitive' } },
          { toCode:   { contains: q, mode: 'insensitive' } },
        ],
      } : {},
      fromCity   ? { fromCity:   { contains: fromCity,   mode: 'insensitive' } } : {},
      toCity     ? { toCity:     { contains: toCity,     mode: 'insensitive' } } : {},
      cabinClass ? { cabinClass: { contains: cabinClass, mode: 'insensitive' } } : {},
      stops !== undefined && stops !== '' ? { stops: parseInt(stops) } : {},
      maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
    ].filter(Boolean),
  };

  return paginate(prisma.flight, where, { price: 'asc' }, page, limit);
};

/**
 * Search user's TRIPS with optional filters.
 * Only returns trips belonging to the logged-in user.
 * Supports: keyword (title, destination), status
 */
const searchTrips = async (userId, filters, page, limit) => {
  const { q, status } = filters;

  const where = {
    userId,   // Always filter by the current user — security!
    AND: [
      q ? {
        OR: [
          { title:       { contains: q, mode: 'insensitive' } },
          { destination: { contains: q, mode: 'insensitive' } },
          { notes:       { contains: q, mode: 'insensitive' } },
        ],
      } : {},
      status ? { status } : {},
    ].filter(Boolean),
  };

  return paginate(prisma.trip, where, { createdAt: 'desc' }, page, limit);
};

/**
 * Search user's WISHLIST with optional filters.
 * Supports: keyword (destination, country, notes), category, visited
 */
const searchWishlist = async (userId, filters, page, limit) => {
  const { q, category, visited } = filters;

  const where = {
    userId,
    AND: [
      q ? {
        OR: [
          { destination: { contains: q, mode: 'insensitive' } },
          { country:     { contains: q, mode: 'insensitive' } },
          { notes:       { contains: q, mode: 'insensitive' } },
        ],
      } : {},
      category ? { category }                                   : {},
      // Convert 'true'/'false' string from query param to boolean
      visited !== undefined && visited !== ''
        ? { visited: visited === 'true' }
        : {},
    ].filter(Boolean),
  };

  return paginate(prisma.wishlist, where, { priority: 'asc' }, page, limit);
};

/**
 * Global search: runs all 4 searches in parallel with a keyword.
 * Returns first-page results from each category (no pagination needed here).
 */
const globalSearch = async (userId, q) => {
  const keyword = q?.trim();
  if (!keyword) return { hotels: [], flights: [], trips: [], wishlist: [] };

  const [hotels, flights, trips, wishlist] = await Promise.all([
    searchHotels({ q: keyword }, 1, 5),
    searchFlights({ q: keyword }, 1, 5),
    searchTrips(userId, { q: keyword }, 1, 5),
    searchWishlist(userId, { q: keyword }, 1, 5),
  ]);

  return {
    hotels:   hotels.data,
    flights:  flights.data,
    trips:    trips.data,
    wishlist: wishlist.data,
    keyword,
  };
};

module.exports = { searchHotels, searchFlights, searchTrips, searchWishlist, globalSearch };
