const Redis = require("ioredis");

const getRedisConfig = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };
};

const createRedisConnection = () => {
    const config = getRedisConfig();
    const client = typeof config === "string"
        ? new Redis(config, { maxRetriesPerRequest: null, lazyConnect: true })
        : new Redis({ ...config, lazyConnect: true });

    client.on("error", () => {
        // Handled gracefully without crashing the server process
    });

    return client;
};

module.exports = {
    getRedisConfig,
    createRedisConnection,
};
