// src/repositories/flight.repository.js
// Handles ALL database queries for the Flight model via Prisma.
// The Service layer calls these functions — never Prisma directly.

const prisma = require('../config/database');

/**
 * Find flights matching search criteria from PostgreSQL database.
 * Supports filtering by origin (city or airport code), destination, cabin class, and max price.
 */
const findFlights = async ({ from, to, cabinClass, maxPrice, sortBy }) => {
  const whereClause = {};

  // Filter by origin (matching city name OR 3-letter IATA code, case-insensitive)
  if (from) {
    whereClause.OR = [
      { fromCode: { equals: from.toUpperCase().trim() } },
      { fromCity: { contains: from.trim(), mode: 'insensitive' } },
    ];
  }

  // Filter by destination (matching city name OR 3-letter IATA code, case-insensitive)
  if (to) {
    const toWhere = [
      { toCode: { equals: to.toUpperCase().trim() } },
      { toCity: { contains: to.trim(), mode: 'insensitive' } },
    ];
    if (whereClause.OR) {
      whereClause.AND = [{ OR: whereClause.OR }, { OR: toWhere }];
      delete whereClause.OR;
    } else {
      whereClause.OR = toWhere;
    }
  }

  // Filter by cabin class if specified
  if (cabinClass && cabinClass !== 'All') {
    whereClause.cabinClass = { equals: cabinClass, mode: 'insensitive' };
  }

  // Filter by maximum budget/price
  if (maxPrice && !isNaN(maxPrice)) {
    whereClause.price = { lte: parseFloat(maxPrice) };
  }

  // Sort order mapping
  let orderBy = { price: 'asc' }; // default: lowest price first
  if (sortBy === 'duration') {
    orderBy = { duration: 'asc' };
  } else if (sortBy === 'departure') {
    orderBy = { departureTime: 'asc' };
  }

  return prisma.flight.findMany({
    where: whereClause,
    orderBy,
  });
};

/**
 * Find a single flight by its ID.
 */
const findById = (id) => {
  return prisma.flight.findUnique({ where: { id } });
};

/**
 * Count total flight records in the database.
 */
const count = () => {
  return prisma.flight.count();
};

/**
 * Bulk create flight records (used for seeding sample flight inventory).
 */
const createMany = (flightList) => {
  return prisma.flight.createMany({
    data: flightList,
    skipDuplicates: true,
  });
};

/**
 * Get distinct origin/destination route summaries available in DB.
 */
const getRoutes = () => {
  return prisma.flight.findMany({
    select: {
      fromCity: true,
      fromCode: true,
      toCity: true,
      toCode: true,
      price: true,
    },
    take: 10,
    orderBy: { price: 'asc' },
  });
};

module.exports = {
  findFlights,
  findById,
  count,
  createMany,
  getRoutes,
};
