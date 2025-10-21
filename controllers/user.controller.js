import bcrypt from 'bcryptjs';
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";

export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

export const createUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            const error = new Error('Name, email, and password are required');
            error.statusCode = 400;
            throw error;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User with this email already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        next(error);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the user first
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Delete all subscriptions associated with this user (cascade delete)
        await Subscription.deleteMany({ user: id });

        // Delete the user
        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User and associated subscriptions deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}