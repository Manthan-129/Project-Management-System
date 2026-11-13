const test = require("node:test");
const assert = require("node:assert/strict");

const originalEnv = { ...process.env };
const { getRedisConfig, isRedisConfigured } = require("../configs/redis");

test.after(() => {
    process.env = originalEnv;
});

test("parses a Redis URL into BullMQ connection options", () => {
    process.env.REDIS_URL = "rediss://queue-user:queue%2Fpass@redis.example.com:6380/2";
    delete process.env.REDIS_HOST;

    const config = getRedisConfig();

    assert.equal(isRedisConfigured(), true);
    assert.equal(config.host, "redis.example.com");
    assert.equal(config.port, 6380);
    assert.equal(config.username, "queue-user");
    assert.equal(config.password, "queue/pass");
    assert.equal(config.db, 2);
    assert.deepEqual(config.tls, {});
    assert.equal(config.maxRetriesPerRequest, null);
});

test("returns null when Redis is not configured", () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;

    assert.equal(isRedisConfigured(), false);
    assert.equal(getRedisConfig(), null);
});
