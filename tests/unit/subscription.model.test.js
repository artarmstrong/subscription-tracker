import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Subscription from '../../models/subscription.model.js';
import User from '../../models/user.model.js';
import { connectTestDb, closeTestDb, clearTestDb } from '../testDb.js';
import { createTestUser } from '../helpers.js';

describe('Subscription Model', () => {
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
  });

  describe('Subscription Creation', () => {
    it('should create a subscription with valid data', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last month
      const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next month
      
      const subscriptionData = {
        name: 'Netflix',
        price: 15.99,
        currency: 'USD',
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: 'Credit Card',
        status: 'active',
        startDate: startDate,
        renewalDate: renewalDate,
        user: testUser._id
      };

      const subscription = await Subscription.create(subscriptionData);

      expect(subscription).toBeDefined();
      expect(subscription.name).toBe(subscriptionData.name);
      expect(subscription.price).toBe(subscriptionData.price);
      expect(subscription.currency).toBe(subscriptionData.currency);
      expect(subscription.frequency).toBe(subscriptionData.frequency);
      expect(subscription.category).toBe(subscriptionData.category);
      expect(subscription.paymentMethod).toBe(subscriptionData.paymentMethod);
      expect(subscription.status).toBe(subscriptionData.status);
      expect(subscription.user.toString()).toBe(testUser._id.toString());
      expect(subscription._id).toBeDefined();
      expect(subscription.createdAt).toBeDefined();
      expect(subscription.updatedAt).toBeDefined();
    });

    it('should set default currency to USD', async () => {
      const subscriptionData = {
        name: 'Netflix',
        price: 15.99,
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: 'Credit Card',
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-02-01'),
        user: testUser._id
      };

      const subscription = await Subscription.create(subscriptionData);
      expect(subscription.currency).toBe('USD');
    });

    it('should set default status to active', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last month
      const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next month
      
      const subscriptionData = {
        name: 'Netflix',
        price: 15.99,
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: 'Credit Card',
        startDate: startDate,
        renewalDate: renewalDate,
        user: testUser._id
      };

      const subscription = await Subscription.create(subscriptionData);
      expect(subscription.status).toBe('active');
    });

    it('should trim whitespace from name and paymentMethod', async () => {
      const subscriptionData = {
        name: '  Netflix  ',
        price: 15.99,
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: '  Credit Card  ',
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-02-01'),
        user: testUser._id
      };

      const subscription = await Subscription.create(subscriptionData);
      expect(subscription.name).toBe('Netflix');
      expect(subscription.paymentMethod).toBe('Credit Card');
    });
  });

  describe('Subscription Validation', () => {
    const baseSubscriptionData = {
      name: 'Netflix',
      price: 15.99,
      frequency: 'monthly',
      category: 'entertainment',
      paymentMethod: 'Credit Card',
      startDate: new Date('2024-01-01'),
      renewalDate: new Date('2024-02-01')
    };

    it('should require name field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.name;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require price field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.price;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require frequency field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.frequency;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require category field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.category;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require paymentMethod field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.paymentMethod;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require startDate field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.startDate;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require renewalDate field', async () => {
      const subscriptionData = { ...baseSubscriptionData };
      delete subscriptionData.renewalDate;
      subscriptionData.user = testUser._id;

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should require user field', async () => {
      const subscriptionData = { ...baseSubscriptionData };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should enforce minimum name length', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        name: 'A',
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should enforce maximum name length', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        name: 'A'.repeat(101),
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should enforce minimum price value', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        price: -1,
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate currency enum values', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        currency: 'INVALID',
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate frequency enum values', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        frequency: 'invalid',
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate category enum values', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        category: 'invalid',
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate status enum values', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        status: 'invalid',
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate startDate is not in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const subscriptionData = {
        ...baseSubscriptionData,
        startDate: futureDate,
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });

    it('should validate renewalDate is after startDate', async () => {
      const subscriptionData = {
        ...baseSubscriptionData,
        startDate: new Date('2024-02-01'),
        renewalDate: new Date('2024-01-01'),
        user: testUser._id
      };

      await expect(Subscription.create(subscriptionData)).rejects.toThrow();
    });
  });

  describe('Subscription Queries', () => {
    beforeEach(async () => {
      await Subscription.create({
        name: 'Netflix',
        price: 15.99,
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: 'Credit Card',
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-02-01'),
        user: testUser._id
      });

      await Subscription.create({
        name: 'Spotify',
        price: 9.99,
        frequency: 'monthly',
        category: 'entertainment',
        paymentMethod: 'PayPal',
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-02-01'),
        user: testUser._id
      });
    });

    it('should find subscriptions by user', async () => {
      const subscriptions = await Subscription.find({ user: testUser._id });
      expect(subscriptions).toHaveLength(2);
    });

    it('should find subscription by name', async () => {
      const subscription = await Subscription.findOne({ name: 'Netflix' });
      expect(subscription).toBeDefined();
      expect(subscription.price).toBe(15.99);
    });

    it('should populate user field', async () => {
      const subscription = await Subscription.findOne({ name: 'Netflix' }).populate('user');
      expect(subscription.user.name).toBe(testUser.name);
      expect(subscription.user.email).toBe(testUser.email);
    });
  });
});
