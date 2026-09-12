const Redis = require("ioredis");

let redisAvailable = false;

const getRedisConfig = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: null,
    };
};

/**
 * Checks once if Redis is reachable.
 * Returns connection configuration if reachable, or null if offline.
 */
const checkRedisAvailability = async () => {
    try {
        const config = getRedisConfig();
        const probe = typeof config === "string"
            ? new Redis(config, { lazyConnect: true, maxRetriesPerRequest: null, retryStrategy: null })
            : new Redis({ ...config, lazyConnect: true, maxRetriesPerRequest: null, retryStrategy: null });

        probe.on("error", () => {
            // Handled gracefully without logging
        });

        await probe.connect();
        await probe.ping();
        redisAvailable = true;
        await probe.disconnect();
        return config;
    } catch (err) {
        redisAvailable = false;
        return null;
    }
};

const isRedisAvailable = () => redisAvailable;

module.exports = {
    getRedisConfig,
    checkRedisAvailability,
    isRedisAvailable,
};
