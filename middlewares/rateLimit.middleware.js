import rateLimit from 'express-rate-limit';
import { MongoStore } from './mongoStore.js';

// Create MongoDB store for rate limiting
const createMongoStore = (collectionName, windowMs) => {
    return new MongoStore({
        collectionName: collectionName,
        windowMs: windowMs
    });
};

// General API rate limit - 100 requests per 15 minutes
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    store: createMongoStore('general_rate_limits', 15 * 60 * 1000),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Strict rate limit for authentication endpoints - 5 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    store: createMongoStore('auth_rate_limits', 15 * 60 * 1000),
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// More lenient rate limit for subscription operations - 200 requests per 15 minutes
export const subscriptionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    store: createMongoStore('subscription_rate_limits', 15 * 60 * 1000),
    message: {
        error: 'Too many subscription requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many subscription requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// User management rate limit - 50 requests per 15 minutes
export const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    store: createMongoStore('user_rate_limits', 15 * 60 * 1000),
    message: {
        error: 'Too many user management requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many user management requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

