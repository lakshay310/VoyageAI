// src/repositories/hotel.repository.js
// Handles ALL database queries for the Hotel model via Prisma.
// The Service layer calls these — never Prisma directly from controllers.

const prisma = require('../config/database');

/**
 * Count total hotels in the database.
 * Used to decide whether to seed initial data.
 */
const count = () => prisma.hotel.count();

/**
 * Bulk-insert an array of hotel objects.
 * Used only once during first-run seeding.
 */
const createMany = (hotels) =>
  prisma.hotel.createMany({ data: hotels, skipDuplicates: true });

/**
 * Search hotels with optional filters.
 * Prisma `contains` is case-insensitive by default on PostgreSQL with `mode: 'insensitive'`.
 *
 * @param {object} filters
 * @param {string} filters.city          - City or country to search in
 * @param {number} filters.minStar       - Minimum star rating (1–5)
 * @param {number} filters.maxPrice      - Maximum price per night in INR
 * @param {string} filters.roomType      - e.g. "Deluxe", "Suite"
 * @param {string} filters.sortBy        - "price" | "rating" | "stars"
 */
const findHotels = ({ city, minStar, maxPrice, roomType, sortBy = 'price' }) => {
  // Build filter conditions dynamically
  const where = {};

  if (city) {
    where.OR = [
      { city:    { contains: city, mode: 'insensitive' } },
      { country: { contains: city, mode: 'insensitive' } },
    ];
  }

  if (minStar)   where.starRating    = { gte: Number(minStar) };
  if (maxPrice)  where.pricePerNight = { lte: Number(maxPrice) };
  if (roomType && roomType !== 'All') {
    where.roomType = { contains: roomType, mode: 'insensitive' };
  }

  // Map sortBy param to Prisma orderBy object
  const orderByMap = {
    price:  { pricePerNight: 'asc' },
    rating: { rating: 'desc' },
    stars:  { starRating: 'desc' },
  };

  return prisma.hotel.findMany({
    where,
    orderBy: orderByMap[sortBy] || { pricePerNight: 'asc' },
    take: 50, // cap results
  });
};

/**
 * Find a hotel by exact name (used for seed version marker lookup).
 */
const findByName = (name) => prisma.hotel.findFirst({ where: { name } });

/**
 * Get a single hotel by its UUID.
 */
const findById = (id) => prisma.hotel.findUnique({ where: { id } });

/**
 * Delete all hotels — used when re-seeding.
 */
const deleteAll = () => prisma.hotel.deleteMany({});

module.exports = { count, createMany, findHotels, findByName, findById, deleteAll };
