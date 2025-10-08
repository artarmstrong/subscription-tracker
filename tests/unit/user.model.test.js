import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import { connectTestDb, closeTestDb, clearTestDb } from '../testDb.js';

describe('User Model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user._id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'JANE@EXAMPLE.COM',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.email).toBe('jane@example.com');
    });

    it('should trim whitespace from name and email', async () => {
      const userData = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        password: 'password123'
      };

      const user = await User.create(userData);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });
  });

  describe('User Validation', () => {
    it('should require name field', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email field', async () => {
      const userData = {
        name: 'John Doe',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password field', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum name length', async () => {
      const userData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce maximum name length', async () => {
      const userData = {
        name: 'J'.repeat(51),
        email: 'john@example.com',
        password: 'password123'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await User.create(userData);
      
      const duplicateUserData = {
        name: 'Jane Doe',
        email: 'john@example.com',
        password: 'password456'
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password456'
      });
    });

    it('should find user by email', async () => {
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
    });

    it('should find user by id', async () => {
      const createdUser = await User.findOne({ email: 'john@example.com' });
      const foundUser = await User.findById(createdUser._id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe('John Doe');
    });

    it('should return all users', async () => {
      const users = await User.find();
      expect(users).toHaveLength(2);
    });

    it('should exclude password when using select', async () => {
      const user = await User.findOne({ email: 'john@example.com' }).select('-password');
      expect(user.password).toBeUndefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });
});
