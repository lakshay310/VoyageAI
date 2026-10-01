// src/repositories/deployment.repository.js
// Reads deployment-relevant data from the database using Prisma.
// Kept separate from business logic (service layer) for clean architecture.

const prisma = require('../config/database');

/**
 * Count total records in core tables.
 * Used to confirm the DB is seeded and working correctly post-deployment.
 * @returns {{ users, trips, bookings, expenses, flights, hotels }}
 */
const getTableCounts = async () => {
  // Run all COUNT queries in parallel for speed using Promise.all
  const [users, trips, bookings, expenses, flights, hotels] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.booking.count(),
    prisma.expense.count(),
    prisma.flight.count(),
    prisma.hotel.count(),
  ]);

  return { users, trips, bookings, expenses, flights, hotels };
};

/**
 * Verify Prisma can reach the database by running a lightweight query.
 * @returns {{ connected: boolean, latencyMs: number }}
 */
const pingDatabase = async () => {
  const start = Date.now();

  // $queryRaw runs a raw SQL string — "SELECT 1" is the lightest possible query
  await prisma.$queryRaw`SELECT 1`;

  return {
    connected: true,
    latencyMs: Date.now() - start,
  };
};

module.exports = { getTableCounts, pingDatabase };
