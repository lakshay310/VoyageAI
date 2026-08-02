// src/config/database.js
// Prisma client singleton.
// We export one shared instance so we don't open too many DB connections.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  // Log SQL queries in development so you can see what's happening
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
