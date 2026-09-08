// src/__tests__/admin.test.js
// Integration tests for the Admin API endpoints.
// Key concepts tested:
//   1. Only ADMIN role can access these routes (authorization)
//   2. Regular USER gets 403 Forbidden
//   3. Unauthenticated gets 401

const request = require('supertest');
const app = require('../app');
const adminRepository = require('../repositories/admin.repository');
const { generateToken } = require('../utils/jwt');

// ── Mock the admin repository ──────────────────────────────────────────────
jest.mock('../repositories/admin.repository', () => ({
  countUsers: jest.fn(),
  countTrips: jest.fn(),
  countBookings: jest.fn(),
  countConfirmedBookings: jest.fn(),
  sumRevenue: jest.fn(),
  countReviews: jest.fn(),
  tripsByStatus: jest.fn(),
  bookingsByType: jest.fn(),
  getRecentUsers: jest.fn(),
  getRecentBookings: jest.fn(),
  getAllUsers: jest.fn(),
  countAllUsers: jest.fn(),
  findUserById: jest.fn(),
  updateUserRole: jest.fn(),
  deleteUser: jest.fn(),
}));

// ── Create tokens for two test roles ──────────────────────────────────────
// Admin token — has ADMIN role
const adminToken = generateToken({
  id: 'admin-id-001',
  email: 'admin@test.com',
  role: 'ADMIN',
});

// User token — has USER role (should get 403 on admin routes)
const userToken = generateToken({
  id: 'user-id-002',
  email: 'user@test.com',
  role: 'USER',
});

describe('Admin API Endpoints', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/admin/overview ─────────────────────────────────────────────
  describe('GET /api/admin/overview', () => {

    it('should return platform stats for ADMIN users', async () => {
      // Set up what each repository function returns
      adminRepository.countUsers.mockResolvedValue(100);
      adminRepository.countTrips.mockResolvedValue(250);
      adminRepository.countBookings.mockResolvedValue(500);
      adminRepository.countConfirmedBookings.mockResolvedValue(400);
      adminRepository.sumRevenue.mockResolvedValue({ _sum: { amount: 75000 } });
      adminRepository.countReviews.mockResolvedValue(80);
      adminRepository.tripsByStatus.mockResolvedValue([
        { status: 'PLANNED', _count: { _all: 100 } },
      ]);
      adminRepository.bookingsByType.mockResolvedValue([
        { type: 'FLIGHT', _count: { _all: 200 } },
      ]);
      adminRepository.getRecentUsers.mockResolvedValue([]);
      adminRepository.getRecentBookings.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Verify stats are in the response
      expect(response.body.data).toHaveProperty('stats');
    });

    it('should return 403 Forbidden for regular USER role', async () => {
      const response = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${userToken}`);

      // USER role should be blocked from admin routes
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/api/admin/overview');
      expect(response.status).toBe(401);
    });
  });

  // ── GET /api/admin/users ────────────────────────────────────────────────
  describe('GET /api/admin/users', () => {

    it('should return paginated list of users for ADMIN', async () => {
      adminRepository.getAllUsers.mockResolvedValue([
        { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'USER' },
      ]);
      adminRepository.countAllUsers.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
