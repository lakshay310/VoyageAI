// src/controllers/map.controller.js
// HTTP controller layer for maps and spatial location endpoints.

const mapService = require('../services/map.service');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/maps/city/:cityName
 * Get map markers and center coordinates for a specific city.
 */
const getCityMap = async (req, res, next) => {
  try {
    const { cityName } = req.params;
    const data = await mapService.getCityMapData(cityName);
    return sendSuccess(res, `Map data for ${cityName} fetched successfully.`, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/maps/trip/:tripId
 * Get map markers and trip route pins for a user's trip.
 */
const getTripMap = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const data = await mapService.getTripMapData(tripId, req.user.id);
    return sendSuccess(res, 'Trip map data fetched successfully.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/maps/search?q=...
 * Search maps and geocode location queries.
 */
const searchLocation = async (req, res, next) => {
  try {
    const query = req.query.q || 'Goa';
    const data = await mapService.searchPlaceMapData(query);
    return sendSuccess(res, `Search results for "${query}" fetched.`, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/maps/featured
 * Get featured destination coordinates and map markers.
 */
const getFeaturedMap = async (req, res, next) => {
  try {
    const data = await mapService.getCityMapData('Goa');
    return sendSuccess(res, 'Featured map data fetched.', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCityMap,
  getTripMap,
  searchLocation,
  getFeaturedMap,
};
