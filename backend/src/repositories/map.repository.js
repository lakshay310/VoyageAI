// src/repositories/map.repository.js
// Database queries for Maps module using Prisma ORM.
// Fetches trips, hotels, and bookings for spatial visualization.

const prisma = require('../config/database');

// Coordinates lookup dictionary for key Indian & International destinations
const CITY_COORDINATES = {
  // Indian Cities
  'goa':        { lat: 15.2993, lng: 74.1240, zoom: 11, country: 'India' },
  'delhi':      { lat: 28.6139, lng: 77.2090, zoom: 12, country: 'India' },
  'mumbai':     { lat: 19.0760, lng: 72.8777, zoom: 12, country: 'India' },
  'jaipur':     { lat: 26.9124, lng: 75.7873, zoom: 12, country: 'India' },
  'manali':     { lat: 32.2432, lng: 77.1892, zoom: 12, country: 'India' },
  'kerala':     { lat: 9.9312,  lng: 76.2673, zoom: 10, country: 'India' },
  'udaipur':    { lat: 24.5854, lng: 73.7125, zoom: 13, country: 'India' },
  'shimla':     { lat: 31.1048, lng: 77.1734, zoom: 13, country: 'India' },
  'varanasi':   { lat: 25.3176, lng: 82.9739, zoom: 13, country: 'India' },
  'bengaluru':  { lat: 12.9716, lng: 77.5946, zoom: 12, country: 'India' },
  'bangalore':  { lat: 12.9716, lng: 77.5946, zoom: 12, country: 'India' },
  'chennai':    { lat: 13.0827, lng: 80.2707, zoom: 12, country: 'India' },
  'hyderabad':  { lat: 17.3850, lng: 78.4867, zoom: 12, country: 'India' },
  'kolkata':    { lat: 22.5726, lng: 88.3639, zoom: 12, country: 'India' },

  // International Cities
  'paris':      { lat: 48.8566, lng: 2.3522,  zoom: 12, country: 'France' },
  'london':     { lat: 51.5074, lng: -0.1278, zoom: 12, country: 'United Kingdom' },
  'dubai':      { lat: 25.2048, lng: 55.2708, zoom: 11, country: 'UAE' },
  'tokyo':      { lat: 35.6762, lng: 139.6503,zoom: 12, country: 'Japan' },
  'singapore':  { lat: 1.3521,  lng: 103.8198,zoom: 12, country: 'Singapore' },
  'bali':       { lat: -8.4095, lng: 115.1889,zoom: 10, country: 'Indonesia' },
  'bangkok':    { lat: 13.7563, lng: 100.5018,zoom: 12, country: 'Thailand' },
  'rome':       { lat: 41.9028, lng: 12.4964, zoom: 12, country: 'Italy' },
  'new york':   { lat: 40.7128, lng: -74.0060,zoom: 11, country: 'USA' },
  'sydney':     { lat: -33.8688,lng: 151.2093,zoom: 12, country: 'Australia' },
};

/**
 * Fetch hotels for a city from database using Prisma.
 */
const findHotelsByCity = async (cityName) => {
  return prisma.hotel.findMany({
    where: {
      city: {
        contains: cityName,
        mode: 'insensitive',
      },
    },
    take: 20,
  });
};

/**
 * Fetch trip details including bookings using Prisma.
 */
const findTripWithBookings = async (tripId, userId) => {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: userId,
    },
    include: {
      bookings: true,
      expenses: true,
    },
  });
};

/**
 * Fetch user's active trips with city names.
 */
const findUserTrips = async (userId) => {
  return prisma.trip.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      destination: true,
      startDate: true,
      endDate: true,
      status: true,
      budget: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  CITY_COORDINATES,
  findHotelsByCity,
  findTripWithBookings,
  findUserTrips,
};
