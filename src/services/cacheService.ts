import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL); // Use the Redis URL


redis.on('error', (err) => {
    console.error('Redis error:', err);
});

export const cache = {
    get: async (key: string) => {
        try {
            return await redis.get(key);
        } catch (err) {
            console.error('Error getting cache key:', err);
        }
    },

    set: async (key: string, value: string, ttl?: number) => {
        try {
            if (ttl) {
                await redis.set(key, value, 'EX', ttl);
            } else {
                await redis.set(key, value);
            }
        } catch (err) {
            console.error('Error setting cache key:', err);
        }
    },

    del: async (key: string) => {
        try {
            await redis.del(key);
        } catch (err) {
            console.error('Error deleting cache key:', err);
        }
    }
};
