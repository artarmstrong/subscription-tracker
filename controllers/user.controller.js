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

        // Validate required fields (handle empty strings)
        if (!name || !email || !password || name.trim() === '' || email.trim() === '' || password.trim() === '') {
            const error = new Error('Name, email, and password are required');
            error.statusCode = 400;
            throw error;
        }

        // Validate password length before hashing
        if (password.length < 6) {
            const error = new Error('Password must be at least 6 characters long');
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

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        // Find the user first
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Prepare update object
        const updateData = {};

        // Update name if provided
        if (name !== undefined) {
            updateData.name = name;
        }

        // Update email if provided and check for duplicates
        if (email !== undefined) {
            // Check if email is being changed and if it's already taken by another user
            if (email !== user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    const error = new Error('Email already in use by another user');
                    error.statusCode = 409;
                    throw error;
                }
                updateData.email = email;
            }
        }

        // Update password if provided (validate then hash it)
        if (password !== undefined) {
            // Validate password length before hashing
            if (password.length < 6) {
                const error = new Error('Password must be at least 6 characters long');
                error.statusCode = 400;
                throw error;
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateData.password = hashedPassword;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            const error = new Error('No valid fields provided for update');
            error.statusCode = 400;
            throw error;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
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