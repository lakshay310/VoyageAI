// src/__tests__/analytics.test.js
// Integration tests for the Analytics API endpoints.
// Analytics is user-scoped — all data belongs to the logged-in user.

const request = require('supertest');
const app = require('../app');
const analyticsRepository = require('../repositories/analytics.repository');
const { generateToken } = require('../utils/jwt');

// ── Mock the analytics repository ─────────────────────────────────────────
// We mock ALL exported functions from the repository.
jest.mock('../repositories/analytics.repository', () => ({
  spendingByCategory: jest.fn(),
  expensesForTrend: jest.fn(),
  tripsByStatus: jest.fn(),
  topDestinations: jest.fn(),
  upcomingTrips: jest.fn(),
  budgetVsActual: jest.fn(),
  getSummaryStats: jest.fn(),
}));

// ── Create a valid test user token ─────────────────────────────────────────
const testUserToken = generateToken({
  id: 'analytics-user-id',
  email: 'analytics@test.com',
  role: 'USER',
});

describe('Analytics API Endpoints', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/analytics/summary ──────────────────────────────────────────
  describe('GET /api/analytics/summary', () => {

    it('should return KPI summary for logged-in user', async () => {
      // Mock getSummaryStats — the function called by the summary endpoint
      analyticsRepository.getSummaryStats.mockResolvedValue({
        totalTrips: 5,
        completedTrips: 2,
        totalBookings: 12,
        totalSpent: 3200,
        reviewCount: 3,
        wishlistCount: 8,
        journalCount: 4,
      });

      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/analytics/summary');
      expect(response.status).toBe(401);
    });
  });

  // ── GET /api/analytics/spending ─────────────────────────────────────────
  describe('GET /api/analytics/spending', () => {

    it('should return spending breakdown by category', async () => {
      analyticsRepository.spendingByCategory.mockResolvedValue([
        { category: 'FOOD', _sum: { amount: 500 } },
        { category: 'TRANSPORT', _sum: { amount: 800 } },
      ]);
      analyticsRepository.expensesForTrend.mockResolvedValue([
        { date: new Date('2025-01-15'), amount: 200 },
      ]);

      const response = await request(app)
        .get('/api/analytics/spending')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/analytics/spending');
      expect(response.status).toBe(401);
    });
  });

  // ── GET /api/analytics/trips ────────────────────────────────────────────
  describe('GET /api/analytics/trips', () => {

    it('should return trip breakdown data', async () => {
      analyticsRepository.tripsByStatus.mockResolvedValue([
        { status: 'PLANNED', _count: { _all: 3 } },
        { status: 'COMPLETED', _count: { _all: 2 } },
      ]);
      // topDestinations and upcomingTrips are also called by this endpoint
      analyticsRepository.topDestinations.mockResolvedValue([
        { destination: 'Paris', _count: { _all: 2 } },
      ]);
      analyticsRepository.upcomingTrips.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/analytics/trips')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ── GET /api/analytics/budget ───────────────────────────────────────────
  describe('GET /api/analytics/budget', () => {

    it('should return budget vs actual data', async () => {
      analyticsRepository.budgetVsActual.mockResolvedValue([
        {
          id: 'trip-1',
          title: 'Paris',
          destination: 'Paris',
          budget: 2000,
          status: 'COMPLETED',
          expenses: [{ amount: 1500 }, { amount: 300 }],
        },
      ]);

      const response = await request(app)
        .get('/api/analytics/budget')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
