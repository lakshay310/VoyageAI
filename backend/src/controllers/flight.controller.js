// src/controllers/flight.controller.js
// Handles HTTP request/response parsing for flight search and bookings.

const flightService = require('../services/flight.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/flights/search (or GET /api/flights/search)
 * Search flights based on origin, destination, cabin class, max price, and passengers.
 */
const searchFlights = async (req, res, next) => {
  try {
    const { origin, destination, cabinClass, maxPrice, sortBy, passengers } = {
      ...req.query,
      ...req.body,
    };

    const flights = await flightService.searchFlights({
      origin,
      destination,
      cabinClass,
      maxPrice,
      sortBy,
      passengers: parseInt(passengers, 10) || 1,
    });

    return sendSuccess(res, 'Flight search successful', {
      flights,
      count: flights.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/flights/popular
 * Returns a list of popular flight routes with starting prices.
 */
const getPopularRoutes = async (req, res, next) => {
  try {
    const routes = await flightService.getPopularRoutes();
    return sendSuccess(res, 'Popular routes fetched successfully', { routes });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/flights/book
 * Books a flight and attaches it as a Booking record to a specified Trip.
 * Requires user authentication (JWT).
 */
const bookFlight = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { flightId, tripId, passengers, cabinClass } = req.body;

    if (!tripId) {
      const error = new Error('Please select a trip to attach this flight booking to.');
      error.statusCode = 400;
      throw error;
    }

    const booking = await flightService.bookFlight(userId, {
      flightId,
      tripId,
      passengers,
      cabinClass,
    });

    return sendSuccess(res, 'Flight booked successfully! 🎉', booking, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  getPopularRoutes,
  bookFlight,
};
