// src/__tests__/trips.test.js
// Integration tests for the Trips API endpoints.
// We mock the trip repository so no real database connection is needed.
// The tests verify that routes, controllers, and services work together.

const request = require('supertest');
const app = require('../app');
const tripRepository = require('../repositories/trip.repository');
const { generateToken } = require('../utils/jwt');

// ── Mock the trip repository ────────────────────────────────────────────────
// jest.mock() replaces the real module with fake functions for testing.
jest.mock('../repositories/trip.repository', () => ({
  create: jest.fn(),
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

// Mock notification service to prevent real DB/socket calls
jest.mock('../services/notification.service', () => ({
  createAndEmit: jest.fn().mockResolvedValue({}),
}));

// ── Helper: create a valid JWT for a test user ──────────────────────────────
// This simulates a logged-in user without needing a real login
const testUserId = 'test-user-id-abc123';
const validToken = generateToken({ id: testUserId, email: 'test@test.com', role: 'USER' });
const authHeader = `Bearer ${validToken}`;

// ── Test data ──────────────────────────────────────────────────────────────
const mockTrip = {
  id: 'trip-id-xyz',
  title: 'Paris Adventure',
  destination: 'Paris, France',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-10'),
  status: 'PLANNED',
  budget: 2000,
  userId: testUserId,
  createdAt: new Date(),
  bookings: [],
  expenses: [],
  _count: { bookings: 0, expenses: 0 },
};

describe('Trips API Endpoints', () => {

  // Reset mock call counts between tests so they don't bleed into each other
  beforeEach(() => jest.clearAllMocks());

  // ── POST /api/trips ─────────────────────────────────────────────────────
  describe('POST /api/trips', () => {

    it('should create a new trip when logged in with valid data', async () => {
      // Tell the mock what to return when create() is called
      tripRepository.create.mockResolvedValue(mockTrip);

      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', authHeader) // attach the JWT
        .send({
          title: 'Paris Adventure',
          destination: 'Paris, France',
          startDate: '2025-12-01',
          endDate: '2025-12-10',
          budget: 2000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Paris Adventure');
      // Verify the repository was actually called once
      expect(tripRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should return 422 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', authHeader)
        .send({ title: 'Incomplete Trip' }); // missing destination, startDate, endDate

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app)
        .post('/api/trips')
        .send({ title: 'Unauthenticated Trip', destination: 'Nowhere' });

      expect(response.status).toBe(401);
    });
  });

  // ── GET /api/trips ──────────────────────────────────────────────────────
  describe('GET /api/trips', () => {

    it('should return all trips for the logged-in user', async () => {
      // Mock returns an array with one trip
      tripRepository.findAllByUser.mockResolvedValue([mockTrip]);

      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Data should be an array
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Paris Adventure');
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app).get('/api/trips');
      expect(response.status).toBe(401);
    });
  });

  // ── GET /api/trips/:id ──────────────────────────────────────────────────
  describe('GET /api/trips/:id', () => {

    it('should return a single trip by ID', async () => {
      tripRepository.findById.mockResolvedValue(mockTrip);

      const response = await request(app)
        .get(`/api/trips/${mockTrip.id}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mockTrip.id);
    });

    it('should return 404 when trip is not found', async () => {
      // Mock returns null — trip does not exist
      tripRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/trips/non-existent-id')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
    });
  });
});
