import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { createUser, getUsers, getUser, deleteUser } from '../../controllers/user.controller.js';
import User from '../../models/user.model.js';
import Subscription from '../../models/subscription.model.js';
import { connectTestDb, closeTestDb, clearTestDb } from '../testDb.js';

describe('User Controller', () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
        jest.clearAllMocks();

        // Setup bcrypt mocks for each test
        jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword123');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createUser', () => {
        it('should create a new user with hashed password', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User created successfully',
                data: expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            });
            expect(res.json.mock.calls[0][0].data.password).toBeUndefined();
        });

        it('should return 400 if name is missing', async () => {
            const req = {
                body: {
                    email: 'john@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Name, email, and password are required',
                    statusCode: 400
                })
            );
        });

        it('should return 400 if email is missing', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Name, email, and password are required',
                    statusCode: 400
                })
            );
        });

        it('should return 400 if password is missing', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'john@example.com'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Name, email, and password are required',
                    statusCode: 400
                })
            );
        });

        it('should return 409 if user with email already exists', async () => {
            // Create a user first
            await User.create({
                name: 'Existing User',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                body: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User with this email already exists',
                    statusCode: 409
                })
            );
        });

        it('should not return password in response', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            const responseData = res.json.mock.calls[0][0].data;
            expect(responseData.password).toBeUndefined();
            expect(responseData.name).toBe('John Doe');
            expect(responseData.email).toBe('john@example.com');
        });

        it('should handle validation errors from User model', async () => {
            const req = {
                body: {
                    name: 'J', // Too short (min: 2)
                    email: 'john@example.com',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getUsers', () => {
        it('should return all users without passwords', async () => {
            // Create test users with valid passwords (min 6 chars)
            await User.create([
                { name: 'User 1', email: 'user1@example.com', password: 'hash123456' },
                { name: 'User 2', email: 'user2@example.com', password: 'hash234567' }
            ]);

            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await getUsers(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({ name: 'User 1', email: 'user1@example.com' }),
                    expect.objectContaining({ name: 'User 2', email: 'user2@example.com' })
                ])
            });

            const users = res.json.mock.calls[0][0].data;
            users.forEach(user => {
                expect(user.password).toBeUndefined();
            });
        });

        it('should handle database errors', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            // Mock User.find to throw an error
            jest.spyOn(User, 'find').mockImplementationOnce(() => {
                throw new Error('Database error');
            });

            await getUsers(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));

            // Restore the mock
            User.find.mockRestore();
        });
    });

    describe('getUser', () => {
        it('should return a user by id without password', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword'
            });

            const req = {
                params: { id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await getUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            });
            expect(res.json.mock.calls[0][0].data.password).toBeUndefined();
        });

        it('should return 404 if user not found', async () => {
            const req = {
                params: { id: '507f1f77bcf86cd799439011' } // Valid but non-existent ObjectId
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await getUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User not found',
                    statusCode: 404
                })
            );
        });

        it('should handle invalid ObjectId', async () => {
            const req = {
                params: { id: 'invalid-id' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await getUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('deleteUser', () => {
        it('should delete a user successfully', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User and associated subscriptions deleted successfully'
            });

            // Verify user is deleted
            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('should delete user and all associated subscriptions (cascade delete)', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            // Create subscriptions for the user
            const subscription1 = await Subscription.create({
                name: 'Netflix',
                price: 15.99,
                currency: 'USD',
                frequency: 'monthly',
                category: 'entertainment',
                paymentMethod: 'Credit Card',
                startDate: new Date('2024-01-01'),
                renewalDate: new Date('2024-02-01'),
                user: user._id
            });

            const subscription2 = await Subscription.create({
                name: 'Spotify',
                price: 9.99,
                currency: 'USD',
                frequency: 'monthly',
                category: 'entertainment',
                paymentMethod: 'PayPal',
                startDate: new Date('2024-01-01'),
                renewalDate: new Date('2024-02-01'),
                user: user._id
            });

            const req = {
                params: { id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            // Verify subscriptions exist before deletion
            let userSubscriptions = await Subscription.find({ user: user._id });
            expect(userSubscriptions).toHaveLength(2);

            await deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);

            // Verify user is deleted
            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();

            // Verify all subscriptions are deleted
            userSubscriptions = await Subscription.find({ user: user._id });
            expect(userSubscriptions).toHaveLength(0);
        });

        it('should return 404 if user does not exist', async () => {
            const req = {
                params: { id: '507f1f77bcf86cd799439011' } // Valid but non-existent ObjectId
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await deleteUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User not found',
                    statusCode: 404
                })
            );
        });

        it('should handle invalid ObjectId', async () => {
            const req = {
                params: { id: 'invalid-id' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await deleteUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle database errors gracefully', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            // Mock User.findByIdAndDelete to throw an error
            jest.spyOn(User, 'findByIdAndDelete').mockImplementationOnce(() => {
                throw new Error('Database error');
            });

            await deleteUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));

            // Restore the mock
            User.findByIdAndDelete.mockRestore();
        });

        it('should delete user even if there are no subscriptions', async () => {
            // Create a user without subscriptions
            const user = await User.create({
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User and associated subscriptions deleted successfully'
            });

            // Verify user is deleted
            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });
    });
});
