import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
    PORT,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN
} = process.env;

// Validate critical environment variables
// DB_URI not required in test environment (uses in-memory MongoDB)
const requiredEnvVars = process.env.NODE_ENV === 'test'
    ? ['JWT_SECRET']
    : ['DB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        `Please ensure they are defined in .env.${process.env.NODE_ENV || 'development'}.local`
    );
}