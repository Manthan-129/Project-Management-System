const mongoose= require('mongoose');

const OTPSchema= new mongoose.Schema({
    email: {type: String, required: true, lowercase: true, trim: true},
    purpose: {type: String, required: true, trim: true},
    otp: {type: String, required: true},
    expiresAt: {type: Date, index: {expires: 0}, required: true},
}, {timestamps: true});

OTPSchema.index({ email: 1, purpose: 1, createdAt: -1 });
module.exports= mongoose.models.OTP || mongoose.model("OTP", OTPSchema);