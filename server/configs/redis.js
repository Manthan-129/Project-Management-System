const Redis = require("ioredis");

const isRedisConfigured = () => {
    return Boolean(process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim());
};

const getQueuePrefix = () => process.env.REDIS_KEY_PREFIX || "devdash";

const getRedisConfig = () => {
    if (!isRedisConfigured()) {
        return null;
    }

    if (process.env.REDIS_URL?.trim()) {
        const redisUrl = new URL(process.env.REDIS_URL.trim());
        const config = {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || (redisUrl.protocol === "rediss:" ? 6380 : 6379),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
        };

        if (redisUrl.username) {
            config.username = decodeURIComponent(redisUrl.username);
        }
        if (redisUrl.password) {
            config.password = decodeURIComponent(redisUrl.password);
        }
        if (redisUrl.pathname.length > 1) {
            config.db = Number.parseInt(redisUrl.pathname.slice(1), 10);
        }
        if (redisUrl.protocol === "rediss:") {
            config.tls = {};
        }

        return config;
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

    const client = new Redis(config);

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
