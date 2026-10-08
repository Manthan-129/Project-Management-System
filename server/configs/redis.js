const Redis = require("ioredis");

const isRedisConfigured = () => {
    return Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
};

const getQueuePrefix = () => process.env.REDIS_KEY_PREFIX || "devdash";

const getRedisConfig = () => {
    if (!isRedisConfigured()) {
        return null;
    }

    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    return {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    };
};

const createRedisConnection = () => {
    const config = getRedisConfig();
    if (!config) {
        return null;
    }

    const client = typeof config === "string"
        ? new Redis(config, { maxRetriesPerRequest: null, enableReadyCheck: false, lazyConnect: true })
        : new Redis(config);

    client.on("error", (err) => {
        console.warn(`Redis connection warning: ${err.message}`);
    });

    return client;
};

module.exports = {
    isRedisConfigured,
    getQueuePrefix,
    getRedisConfig,
    createRedisConnection,
};
