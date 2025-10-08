import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Set longer timeout for async operations
jest.setTimeout(30000);

// Suppress console.log during tests (uncomment if needed)
// console.log = jest.fn();

// Global test setup
beforeAll(async () => {
  // Global setup code here
});

afterAll(async () => {
  // Global cleanup code here
});
