import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
import { JWT_SECRET } from '../config/env.js';

// Fallback for tests if JWT_SECRET is not set
const TEST_JWT_SECRET = JWT_SECRET || 'test-jwt-secret-for-testing-only';

// Test data factories
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  const mergedData = { ...defaultUser, ...userData };
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  mergedData.password = await bcrypt.hash(mergedData.password, salt);

  const user = await User.create(mergedData);
  return user;
};

export const createTestSubscription = async (userId, subscriptionData = {}) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last month
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next month
  
  const defaultSubscription = {
    name: 'Netflix',
    price: 15.99,
    currency: 'USD',
    frequency: 'monthly',
    category: 'entertainment',
    paymentMethod: 'Credit Card',
    status: 'active',
    startDate: startDate,
    renewalDate: renewalDate,
    user: userId
  };

  const mergedData = { ...defaultSubscription, ...subscriptionData };
  const subscription = await Subscription.create(mergedData);
  return subscription;
};

// JWT helpers
export const generateTestToken = (userId) => {
  return jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
};

export const decodeTestToken = (token) => {
  return jwt.verify(token, TEST_JWT_SECRET);
};

// API test helpers
export const loginUser = async (request, userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateTestToken(user._id);
  
  return {
    user,
    token,
    authHeaders: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Mock data generators
export const generateUserData = (overrides = {}) => ({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  ...overrides
});

export const generateSubscriptionData = (overrides = {}) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last month
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next month
  
  return {
    name: 'Spotify',
    price: 9.99,
    currency: 'USD',
    frequency: 'monthly',
    category: 'entertainment',
    paymentMethod: 'Credit Card',
    status: 'active',
    startDate: startDate,
    renewalDate: renewalDate,
    ...overrides
  };
};

// Validation helpers
export const expectSuccessResponse = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
};

export const expectErrorResponse = (response, statusCode, message = null) => {
  expect(response.status).toBe(statusCode);
  if (message) {
    expect(response.body.message).toContain(message);
  }
};

// Database helpers
export const countDocuments = async (Model) => {
  return await Model.countDocuments();
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};
