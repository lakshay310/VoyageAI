// prisma/seed.js
// Seeds the database with sample data for development and testing.
// Run: node prisma/seed.js
//
// This creates two users, two trips, bookings, and expenses so you can
// immediately test the full feature set without inserting data manually.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Create Users ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const demoPassword  = await bcrypt.hash('Demo@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripplanner.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@tripplanner.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tripplanner.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@tripplanner.com',
      password: demoPassword,
      role: 'USER',
    },
  });

  const voyageAdminPass = await bcrypt.hash('admin1234', 10);
  const voyageUserPass  = await bcrypt.hash('test1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@voyage.ai' },
    update: {},
    create: {
      name: 'Voyage Admin',
      email: 'admin@voyage.ai',
      password: voyageAdminPass,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'weathertest2@voyage.ai' },
    update: {},
    create: {
      name: 'Weather Test User',
      email: 'weathertest2@voyage.ai',
      password: voyageUserPass,
      role: 'USER',
    },
  });

  console.log(`✅ Users created: ${admin.email}, ${demoUser.email}, weathertest2@voyage.ai, admin@voyage.ai`);

  // ── 2. Create Trips ──────────────────────────────────────────────────────────
  // Clean up previous seed trips for demo user so seed is idempotent
  await prisma.trip.deleteMany({ where: { userId: demoUser.id } });

  const goaTrip = await prisma.trip.create({
    data: {
      title: 'Goa Beach Trip',
      destination: 'Goa, India',
      startDate: new Date('2025-12-20'),
      endDate:   new Date('2025-12-27'),
      budget: 30000,
      status: 'PLANNED',
      notes: 'Beach holiday — stay near Baga beach, rent a scooter.',
      userId: demoUser.id,
    },
  });

  const munnarTrip = await prisma.trip.create({
    data: {
      title: 'Munnar Tea Gardens',
      destination: 'Munnar, Kerala',
      startDate: new Date('2026-01-10'),
      endDate:   new Date('2026-01-14'),
      budget: 20000,
      status: 'PLANNED',
      notes: 'Honeymoon trip — book a hillside resort.',
      userId: demoUser.id,
    },
  });

  console.log(`✅ Trips created: "${goaTrip.title}", "${munnarTrip.title}"`);

  // ── 3. Create Bookings ───────────────────────────────────────────────────────
  await prisma.booking.createMany({
    data: [
      {
        type: 'FLIGHT',
        provider: 'IndiGo',
        reference: 'IGO-20251220',
        amount: 8000,
        status: 'CONFIRMED',
        tripId: goaTrip.id,
        userId: demoUser.id,
      },
      {
        type: 'HOTEL',
        provider: 'Airbnb – Baga Beach Villa',
        reference: 'AIR-GOA-001',
        amount: 12000,
        status: 'CONFIRMED',
        tripId: goaTrip.id,
        userId: demoUser.id,
      },
      {
        type: 'FLIGHT',
        provider: 'Air India',
        reference: 'AI-20260110',
        amount: 6500,
        status: 'PENDING',
        tripId: munnarTrip.id,
        userId: demoUser.id,
      },
    ],
  });

  console.log('✅ Bookings created.');

  // ── 4. Create Expenses ───────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      {
        title: 'Beach shack dinner',
        amount: 1200,
        category: 'FOOD',
        date: new Date('2025-12-21'),
        tripId: goaTrip.id,
      },
      {
        title: 'Scooter rental (3 days)',
        amount: 1800,
        category: 'TRANSPORT',
        date: new Date('2025-12-21'),
        tripId: goaTrip.id,
      },
      {
        title: 'Dudhsagar waterfall tour',
        amount: 2500,
        category: 'ACTIVITIES',
        date: new Date('2025-12-22'),
        tripId: goaTrip.id,
      },
      {
        title: 'Souvenir shopping',
        amount: 3000,
        category: 'SHOPPING',
        date: new Date('2025-12-24'),
        tripId: goaTrip.id,
      },
    ],
  });

  console.log('✅ Expenses created.\n');

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('🎉 Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Admin Login  →  admin@tripplanner.com  |  Admin@123');
  console.log('Demo Login   →  demo@tripplanner.com   |  Demo@123');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
