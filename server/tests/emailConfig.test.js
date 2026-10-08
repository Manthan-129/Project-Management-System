const test = require('node:test');
const assert = require('node:assert/strict');

const { assertEmailConfig } = require('../configs/emailConfig');

const originalEnv = { ...process.env };

test('assertEmailConfig returns parsed config when required env exists', () => {
    process.env.SMTP_HOST = 'smtp-relay.brevo.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SENDER_EMAIL = 'sender@example.com';

    const config = assertEmailConfig();

    assert.equal(config.smtpHost, 'smtp-relay.brevo.com');
    assert.equal(config.smtpPort, 587);
    assert.equal(config.smtpSecure, false);
    assert.equal(config.senderEmail, 'sender@example.com');
});

test('assertEmailConfig throws actionable message when required env is missing', () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SENDER_EMAIL;

    assert.throws(() => assertEmailConfig(), /Missing: SMTP_USER, SMTP_PASS, SENDER_EMAIL/);
});

test.after(() => {
    process.env = originalEnv;
});
