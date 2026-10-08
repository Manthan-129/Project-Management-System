const test = require('node:test');
const assert = require('node:assert/strict');

const { issueOtp, verifyOtp } = require('../services/otpService');

const createOtpModel = () => {
    const state = {
        deletedMany: [],
        created: [],
        deletedOne: [],
        record: null,
    };

    return {
        state,
        deleteMany: async (query) => {
            state.deletedMany.push(query);
        },
        create: async (doc) => {
            state.created.push(doc);
            return doc;
        },
        findOne: () => ({
            sort: async () => state.record,
        }),
        deleteOne: async (query) => {
            state.deletedOne.push(query);
        },
    };
};

test('issueOtp stores hashed OTP and sends email', async () => {
    const otpModel = createOtpModel();
    const sentEmails = [];

    await issueOtp({
        email: 'user@example.com',
        purpose: 'registration',
        otpModel,
        now: () => 1000,
        hash: async (raw) => `hash:${raw}`,
        buildMailOptions: (otp) => ({ to: 'user@example.com', subject: `OTP ${otp}` }),
        sendEmail: async (mailOptions) => {
            sentEmails.push(mailOptions);
        },
    });

    assert.equal(otpModel.state.created.length, 1);
    assert.equal(otpModel.state.created[0].email, 'user@example.com');
    assert.equal(otpModel.state.created[0].purpose, 'registration');
    assert.match(otpModel.state.created[0].otp, /^hash:/);
    assert.equal(sentEmails.length, 1);
    assert.equal(otpModel.state.deletedMany.length, 1);
});

test('issueOtp cleans OTP records when provider send fails', async () => {
    const otpModel = createOtpModel();

    await assert.rejects(
        issueOtp({
            email: 'user@example.com',
            purpose: 'registration',
            otpModel,
            hash: async (raw) => `hash:${raw}`,
            buildMailOptions: () => ({ to: 'user@example.com', subject: 'OTP' }),
            sendEmail: async () => {
                throw new Error('smtp failure');
            },
        }),
        /smtp failure/
    );

    assert.equal(otpModel.state.deletedMany.length, 2);
});

test('verifyOtp handles missing record', async () => {
    const otpModel = createOtpModel();
    otpModel.state.record = null;

    const result = await verifyOtp({
        email: 'user@example.com',
        purpose: 'registration',
        otp: '123456',
        otpModel,
    });

    assert.deepEqual(result, { valid: false, reason: 'missing' });
});

test('verifyOtp handles expired record and deletes it', async () => {
    const otpModel = createOtpModel();
    otpModel.state.record = { _id: '1', otp: 'hash', expiresAt: new Date('2020-01-01T00:00:00Z') };

    const result = await verifyOtp({
        email: 'user@example.com',
        purpose: 'registration',
        otp: '123456',
        otpModel,
        now: () => new Date('2020-01-01T00:00:01Z'),
    });

    assert.deepEqual(result, { valid: false, reason: 'expired' });
    assert.equal(otpModel.state.deletedOne.length, 1);
});

test('verifyOtp handles invalid OTP', async () => {
    const otpModel = createOtpModel();
    otpModel.state.record = { _id: '1', otp: 'hash', expiresAt: new Date('2099-01-01T00:00:00Z') };

    const result = await verifyOtp({
        email: 'user@example.com',
        purpose: 'registration',
        otp: '123456',
        otpModel,
        compare: async () => false,
    });

    assert.deepEqual(result, { valid: false, reason: 'invalid' });
    assert.equal(otpModel.state.deletedOne.length, 0);
});

test('verifyOtp handles valid OTP and deletes record', async () => {
    const otpModel = createOtpModel();
    otpModel.state.record = { _id: '1', otp: 'hash', expiresAt: new Date('2099-01-01T00:00:00Z') };

    const result = await verifyOtp({
        email: 'user@example.com',
        purpose: 'registration',
        otp: '123456',
        otpModel,
        compare: async () => true,
    });

    assert.deepEqual(result, { valid: true });
    assert.equal(otpModel.state.deletedOne.length, 1);
});
