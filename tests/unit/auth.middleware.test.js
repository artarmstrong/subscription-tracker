import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import authorize from '../../middlewares/auth.middleware.js';
import User from '../../models/user.model.js';
import { connectTestDb, closeTestDb, clearTestDb } from '../testDb.js';
import { createTestUser, generateTestToken } from '../helpers.js';

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

describe('Auth Middleware', () => {
  let req, res, next;
  let testUser;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    testUser = await createTestUser();

    req = {
      headers: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Set up User.findById mock
    User.findById = jest.fn();
    
    // Clear all mocks but keep the User.findById mock function
    jest.clearAllMocks();
  });

  describe('Valid Authorization', () => {
    it('should authorize user with valid Bearer token', async () => {
      const token = generateTestToken(testUser._id);
      req.headers.authorization = `Bearer ${token}`;

      // Mock User.findById to return the test user
      User.findById.mockResolvedValue(testUser);

      await authorize(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(testUser._id.toString());
      expect(req.user).toEqual(testUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should extract token from authorization header correctly', async () => {
      const token = generateTestToken(testUser._id);
      req.headers.authorization = `Bearer ${token}`;

      User.findById.mockResolvedValue(testUser);

      await authorize(req, res, next);

      expect(User.findById).toHaveBeenCalled();
    });
  });

  describe('Invalid Authorization', () => {
    it('should return 401 when no authorization header is provided', async () => {
      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic token123';

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing after Bearer', async () => {
      req.headers.authorization = 'Bearer ';

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Unauthorized'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Unauthorized', 
        error: expect.any(String) 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      const token = generateTestToken(testUser._id);
      req.headers.authorization = `Bearer ${token}`;

      User.findById.mockResolvedValue(null);

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id }, 
        'test-jwt-secret-for-testing-only', 
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${expiredToken}`;

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Unauthorized', 
        error: expect.stringContaining('expired') 
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const token = generateTestToken(testUser._id);
      req.headers.authorization = `Bearer ${token}`;

      User.findById.mockRejectedValue(new Error('Database connection error'));

      await authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Unauthorized', 
        error: 'Database connection error' 
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
