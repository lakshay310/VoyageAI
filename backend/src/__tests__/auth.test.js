// src/__tests__/auth.test.js
// Integration test for authentication endpoints.
// We mock the user repository to run tests without a live database connection.

const request = require('supertest');
const app = require('../app');
const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');

// Mock the user repository methods
jest.mock('../repositories/user.repository', () => {
  const mockUsers = {};
  return {
    findByEmail: jest.fn(async (email) => {
      return mockUsers[email] || null;
    }),
    create: jest.fn(async (data) => {
      mockUsers[data.email] = {
        id: 'mocked-user-id-12345',
        ...data,
        role: 'USER',
        createdAt: new Date(),
      };
      return mockUsers[data.email];
    }),
    findById: jest.fn(async (id) => {
      return {
        id,
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      };
    }),
  };
});

describe('Authentication API Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'integration_test@example.com',
    password: 'TestPassword123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should return 422 validation error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete' }); // missing email and password

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Pre-populate mock users with a hashed password user for login test
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await userRepository.create({
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 unauthorised for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong_password',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
