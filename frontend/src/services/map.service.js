// src/services/map.service.js
// Frontend service layer for Maps module API calls.

import api from './api';

/** Fetch featured map data */
export const getFeaturedMap = () => api.get('/maps/featured');

/** Fetch map markers for a specific city */
export const getCityMap = (cityName) => api.get(`/maps/city/${encodeURIComponent(cityName)}`);

/** Fetch map data for a specific user trip */
export const getTripMap = (tripId) => api.get(`/maps/trip/${tripId}`);

/** Search locations and geocode query */
export const searchLocationMap = (query) => api.get(`/maps/search?q=${encodeURIComponent(query)}`);
