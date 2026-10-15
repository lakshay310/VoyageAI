// scripts/unlock.js
// Clears any stuck Postgres advisory locks before running Prisma migrations.
// This prevents Prisma P1002 timeouts when using Neon connection poolers.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function unlock() {
  if (!process.env.DATABASE_URL) return;
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock_all();');
    console.log('[unlock] Checked and cleared any stale advisory locks.');
  } catch (err) {
    console.warn('[unlock] Notice:', err.message);
  } finally {
    try { await prisma.$disconnect(); } catch { /* ignore */ }
  }
}

unlock();
