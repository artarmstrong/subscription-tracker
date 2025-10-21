import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { createUser, getUsers, getUser, updateUser, deleteUser } from '../../controllers/user.controller.js';
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

        it('should reject name that is too long (max: 50)', async () => {
            const req = {
                body: {
                    name: 'A'.repeat(51), // 51 characters, exceeds max of 50
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

        it('should reject password that is too short (min: 6)', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: '12345' // Only 5 characters, min is 6
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

        it('should reject invalid email format', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'invalid-email', // Missing @ and domain
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

        it('should convert email to lowercase', async () => {
            const req = {
                body: {
                    name: 'John Doe',
                    email: 'JOHN@EXAMPLE.COM',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User created successfully',
                data: expect.objectContaining({
                    email: 'john@example.com' // Should be lowercase
                })
            });
        });

        it('should trim whitespace from name and email', async () => {
            const req = {
                body: {
                    name: '  John Doe  ',
                    email: '  john@example.com  ',
                    password: 'password123'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await createUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User created successfully',
                data: expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            });
        });

        it('should handle empty string as missing field', async () => {
            const req = {
                body: {
                    name: '',
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

    describe('updateUser', () => {
        it('should update user name successfully', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { name: 'Jane Smith' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'Jane Smith',
                    email: 'john@example.com'
                })
            });

            // Verify password is not in response
            expect(res.json.mock.calls[0][0].data.password).toBeUndefined();
        });

        it('should update user email successfully', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { email: 'newemail@example.com' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'John Doe',
                    email: 'newemail@example.com'
                })
            });
        });

        it('should update user password successfully (hashed)', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { password: 'newPassword456' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 'salt');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            });

            // Verify updated user has new hashed password
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.password).toBe('hashedPassword123'); // Mocked hash value
        });

        it('should update multiple fields at once', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    password: 'newPassword789'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'Jane Smith',
                    email: 'jane@example.com'
                })
            });
        });

        it('should return 404 if user does not exist', async () => {
            const req = {
                params: { id: '507f1f77bcf86cd799439011' }, // Valid but non-existent ObjectId
                body: { name: 'New Name' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User not found',
                    statusCode: 404
                })
            );
        });

        it('should return 409 if email is already taken by another user', async () => {
            // Create two users
            const user1 = await User.create({
                name: 'User 1',
                email: 'user1@example.com',
                password: 'hashedPassword123'
            });

            const user2 = await User.create({
                name: 'User 2',
                email: 'user2@example.com',
                password: 'hashedPassword123'
            });

            // Try to update user1's email to user2's email
            const req = {
                params: { id: user1._id.toString() },
                body: { email: 'user2@example.com' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Email already in use by another user',
                    statusCode: 409
                })
            );
        });

        it('should allow updating to the same email (no change)', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            // Update with the same email (should not trigger duplicate check)
            const req = {
                params: { id: user._id.toString() },
                body: { email: 'john@example.com', name: 'Jane Doe' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'Jane Doe',
                    email: 'john@example.com'
                })
            });
        });

        it('should return 400 if no fields are provided', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No valid fields provided for update',
                    statusCode: 400
                })
            );
        });

        it('should handle invalid ObjectId', async () => {
            const req = {
                params: { id: 'invalid-id' },
                body: { name: 'New Name' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should run validators and handle validation errors', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            // Try to update with invalid name (too short)
            const req = {
                params: { id: user._id.toString() },
                body: { name: 'J' } // Too short (min: 2)
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should not return password in response', async () => {
            // Create a user
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { name: 'Jane Smith' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            const responseData = res.json.mock.calls[0][0].data;
            expect(responseData.password).toBeUndefined();
        });

        it('should reject name that is too long (max: 50)', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { name: 'A'.repeat(51) } // 51 characters, exceeds max of 50
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should reject password that is too short (min: 6)', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { password: '12345' } // Only 5 characters, min is 6
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should reject invalid email format when updating', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { email: 'invalid-email-format' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should convert email to lowercase when updating', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { email: 'NEWEMAIL@EXAMPLE.COM' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    email: 'newemail@example.com' // Should be lowercase
                })
            });
        });

        it('should trim whitespace from name and email when updating', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: {
                    name: '  Jane Smith  ',
                    email: '  jane@example.com  '
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User updated successfully',
                data: expect.objectContaining({
                    name: 'Jane Smith',
                    email: 'jane@example.com'
                })
            });
        });

        it('should handle empty strings for optional update fields', async () => {
            const user = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            });

            const req = {
                params: { id: user._id.toString() },
                body: { name: '' } // Empty string
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await updateUser(req, res, next);

            // Empty string should trigger validation error (minLength: 2)
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
