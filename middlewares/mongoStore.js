import mongoose from 'mongoose';

// Schema for rate limit data
const rateLimitSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    totalHits: {
        type: Number,
        default: 0
    },
    resetTime: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    }
});

// Create model
const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

/**
 * Custom MongoDB store for express-rate-limit
 */
export class MongoStore {
    constructor(options = {}) {
        this.collectionName = options.collectionName || 'rateLimit';
        this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
        
        // Create a separate model for this store instance
        this.model = mongoose.model(
            this.collectionName,
            rateLimitSchema,
            this.collectionName
        );
    }

    /**
     * Method called by express-rate-limit on each request
     */
    async increment(key) {
        const now = new Date();
        const resetTime = new Date(now.getTime() + this.windowMs);

        try {
            // Try to find existing record
            let record = await this.model.findOne({ key });

            if (!record) {
                // Create new record
                record = await this.model.create({
                    key,
                    totalHits: 1,
                    resetTime
                });
                
                return {
                    totalHits: 1,
                    resetTime
                };
            }

            // Check if window has expired
            if (now >= record.resetTime) {
                // Reset the counter
                record.totalHits = 1;
                record.resetTime = resetTime;
            } else {
                // Increment the counter
                record.totalHits += 1;
            }

            await record.save();

            return {
                totalHits: record.totalHits,
                resetTime: record.resetTime
            };

        } catch (error) {
            console.error('MongoDB Store Error:', error);
            // Fallback: allow the request but log the error
            return {
                totalHits: 1,
                resetTime
            };
        }
    }

    /**
     * Method called by express-rate-limit to decrement on successful response
     */
    async decrement(key) {
        try {
            const record = await this.model.findOne({ key });
            if (record && record.totalHits > 0) {
                record.totalHits -= 1;
                await record.save();
            }
        } catch (error) {
            console.error('MongoDB Store Decrement Error:', error);
        }
    }

    /**
     * Method called by express-rate-limit to reset a key
     */
    async resetKey(key) {
        try {
            await this.model.deleteOne({ key });
        } catch (error) {
            console.error('MongoDB Store Reset Error:', error);
        }
    }

    /**
     * Method called by express-rate-limit to get current state
     */
    async get(key) {
        try {
            const record = await this.model.findOne({ key });
            if (!record) {
                return undefined;
            }

            const now = new Date();
            if (now >= record.resetTime) {
                // Window expired, clean up
                await this.model.deleteOne({ key });
                return undefined;
            }

            return {
                totalHits: record.totalHits,
                resetTime: record.resetTime
            };
        } catch (error) {
            console.error('MongoDB Store Get Error:', error);
            return undefined;
        }
    }

    /**
     * Optional cleanup method
     */
    async cleanup() {
        try {
            const now = new Date();
            await this.model.deleteMany({ resetTime: { $lte: now } });
        } catch (error) {
            console.error('MongoDB Store Cleanup Error:', error);
        }
    }
}
