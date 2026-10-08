const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");

const OTP_EXPIRY_MINUTES = Number.parseInt(process.env.OTP_EXPIRY_MINUTES, 10) > 0
    ? Number.parseInt(process.env.OTP_EXPIRY_MINUTES, 10)
    : 5;

const generateNumericOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueOtp = async ({
    email,
    purpose,
    buildMailOptions,
    sendEmail,
    otpModel = OTP,
    hash = bcrypt.hash,
    now = Date.now,
}) => {
    const otpCode = generateNumericOtp();
    const otpHash = await hash(otpCode, 10);

    await otpModel.deleteMany({ email, purpose });

    await otpModel.create({
        email,
        purpose,
        otp: otpHash,
        expiresAt: new Date(now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    try {
        const mailOptions = buildMailOptions(otpCode, OTP_EXPIRY_MINUTES);
        await sendEmail(mailOptions, { requireDelivery: true });
    } catch (error) {
        await otpModel.deleteMany({ email, purpose });
        throw error;
    }

    return { expiresInMinutes: OTP_EXPIRY_MINUTES };
};

const verifyOtp = async ({
    email,
    purpose,
    otp,
    otpModel = OTP,
    compare = bcrypt.compare,
    now = () => new Date(),
}) => {
    const otpRecord = await otpModel.findOne({ email, purpose }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return { valid: false, reason: "missing" };
    }

    if (otpRecord.expiresAt < now()) {
        await otpModel.deleteOne({ _id: otpRecord._id });
        return { valid: false, reason: "expired" };
    }

    const isMatch = await compare(otp, otpRecord.otp);
    if (!isMatch) {
        return { valid: false, reason: "invalid" };
    }

    await otpModel.deleteOne({ _id: otpRecord._id });
    return { valid: true };
};

module.exports = {
    issueOtp,
    verifyOtp,
    OTP_EXPIRY_MINUTES,
};
