const Redis = require("ioredis");

const REDIS_PING_TIMEOUT_MS = 3000;
const DEFAULT_REDIS_PORT = 6379;

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseRedisUrlToOptions = (redisUrl) => {
    const parsed = new URL(redisUrl);
    const dbSegment = parsed.pathname.replace("/", "");
    const db = dbSegment ? Number.parseInt(dbSegment, 10) : undefined;

    return {
        host: parsed.hostname,
        port: parsePositiveInteger(parsed.port, DEFAULT_REDIS_PORT),
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        db: Number.isInteger(db) ? db : undefined,
        tls: parsed.protocol === "rediss:" ? {} : undefined,
    };
};

const isRedisConfigured = (env = process.env) => {
    return Boolean(env.REDIS_URL || env.REDIS_HOST);
};

const getQueuePrefix = (env = process.env) => env.QUEUE_PREFIX || env.REDIS_KEY_PREFIX || "devdash";

const getRedisConfig = (env = process.env) => {
    if (!isRedisConfigured(env)) {
        return null;
    }

    const baseOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    };

    if (env.REDIS_URL) {
        return {
            ...parseRedisUrlToOptions(env.REDIS_URL),
            ...baseOptions,
        };
    }

    return {
        host: env.REDIS_HOST,
        port: parsePositiveInteger(env.REDIS_PORT, DEFAULT_REDIS_PORT),
        password: env.REDIS_PASSWORD || undefined,
        username: env.REDIS_USERNAME || undefined,
        ...baseOptions,
    };
};

const createRedisConnection = (config = getRedisConfig()) => {
    if (!config) {
        return null;
    }

    const client = new Redis(config);

    client.on("error", (err) => {
        console.warn(`Redis connection warning: ${err.message}`);
    });

    return client;
};

const checkRedisHealth = async ({
    env = process.env,
    timeoutMs = REDIS_PING_TIMEOUT_MS,
    logger = console,
} = {}) => {
    if (!isRedisConfigured(env)) {
        logger.info("Redis health: unavailable (not configured)");
        return { configured: false, status: "unavailable" };
    }

    const client = createRedisConnection(getRedisConfig(env));
    if (!client) {
        logger.info("Redis health: unavailable (config invalid)");
        return { configured: true, status: "unavailable" };
    }

    let timeout;
    try {
        timeout = setTimeout(() => {
            client.disconnect();
        }, timeoutMs);

        await client.connect();
        const ping = await client.ping();
        const isConnected = ping === "PONG";
        logger.info(`Redis health: ${isConnected ? "connected" : "unavailable"}`);
        return { configured: true, status: isConnected ? "connected" : "unavailable" };
    } catch (error) {
        logger.warn(`Redis health: unavailable (${error.message})`);
        return { configured: true, status: "unavailable" };
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
        try {
            await client.quit();
        } catch {
            client.disconnect();
        }
    }
};

module.exports = {
    DEFAULT_REDIS_PORT,
    isRedisConfigured,
    getQueuePrefix,
    parseRedisUrlToOptions,
    parsePositiveInteger,
    getRedisConfig,
    createRedisConnection,
    checkRedisHealth,
};
