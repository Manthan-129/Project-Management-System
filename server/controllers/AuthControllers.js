const User = require('../models/User');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
const validator= require('validator');
const { enqueueEmail } = require('../queues/emailQueue');
const { getSenderAddress } = require('../configs/nodemailer');
const { EmailConfigError } = require('../configs/emailConfig');
const { issueOtp, verifyOtp } = require('../services/otpService');
const {registrationTemplate, forgetPasswordTemplate, twoFactorTemplate}= require('../utils/emailTemplates.js');

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const REGISTRATION_OTP_PURPOSE = process.env.OTP_PURPOSE_REGISTRATION || 'registration';
const LOGIN_2FA_OTP_PURPOSE = process.env.OTP_PURPOSE_LOGIN_2FA || 'login_2fa';
const FORGET_PASSWORD_OTP_PURPOSE = process.env.OTP_PURPOSE_FORGET_PASSWORD || 'forget_password';

const sendOtpEmailOrThrow = async (mailOptions) => {
    try {
        await enqueueEmail(mailOptions, { requireDelivery: true });
    } catch (error) {
        if (error instanceof EmailConfigError) {
            const configError = new Error(error.message);
            configError.status = 503;
            throw configError;
        }

        const deliveryError = new Error("Unable to send OTP email right now. Please try again later.");
        deliveryError.status = 502;
        throw deliveryError;
    }
};

// Create a Token 
const createToken = (id)=>{
    if(!JWT_SECRET_KEY){
        throw new Error('JWT secret key is missing');
    }

    const token= jwt.sign({id}, JWT_SECRET_KEY, {expiresIn: '7d'});
    return token;

}

const createTwoFactorToken = (id)=>{
    if(!JWT_SECRET_KEY){
        throw new Error('JWT secret key is missing');
    }

    return jwt.sign({id, purpose: 'login_2fa'}, JWT_SECRET_KEY, {expiresIn: '10m'});
}

// Register a new user
const sendRegistrationOTP= async (req, res)=>{
    try{
        const rawEmail = req.body.email;
        const rawUsername = req.body.username;
        
        if(!rawEmail || !rawUsername){
            return res.status(400).json({success: false, message: "Email and username are required"});
        }

        const email = rawEmail.trim().toLowerCase();
        const username = rawUsername.trim();
        // Validate email and username
        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Please enter a valid email address"});
        }

        const existingUser= await User.findOne({ $or: [{ email }, { username }] }).select('email username').lean();
        if(existingUser){
            const msg = existingUser.email === email
                ? "Email is already registered"
                : "Username is already taken";
            return res.status(400).json({success: false, message: msg});
        }

        await issueOtp({
            email,
            purpose: REGISTRATION_OTP_PURPOSE,
            sendEmail: sendOtpEmailOrThrow,
            buildMailOptions: (otp, expiresInMinutes) => {
                const tmpl = registrationTemplate(otp, expiresInMinutes);
                return {
                    from: getSenderAddress("DevDash Support"),
                    to: email,
                    subject: tmpl.subject,
                    html: tmpl.html,
                };
            },
        });
        return res.status(200).json({success: true, message: "OTP sent to email successfully"});

    }catch(error){
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error("Error in registrationOTP:", error.message);
        return res.status(500).json({success: false, message: "Send OTP for Signup Error"});
    }
}

// Complete registration after OTP verification

const verifyRegistrationOTP= async (req, res)=>{
    try{
        const {password, otp, firstName, lastName}= req.body;
        const rawEmail = req.body.email;
        const rawUsername = req.body.username;

        if(!rawEmail || !rawUsername || !password || !otp || !firstName || !lastName){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        const email = rawEmail.trim().toLowerCase();
        const username = rawUsername.trim();

        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Please enter a valid email address"});
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if(existingUser){
            return res.status(409).json({success: false, message: "Email or username is already in use"});
        }
        
        const otpVerification = await verifyOtp({
            email,
            purpose: REGISTRATION_OTP_PURPOSE,
            otp,
        });

        if(!otpVerification.valid){
            if (otpVerification.reason === "expired") {
                return res.status(404).json({success: false, message: "OTP has expired. Please request a new one."});
            }
            if (otpVerification.reason === "invalid") {
                return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
            }
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }

        const hashPassword= await bcrypt.hash(password, 10);

        const newUser= await User.create({
            firstName, lastName, email, username, password: hashPassword
        });

        const token= createToken(newUser._id);

        return res.status(200).json({success: true, message: "User registered successfully", token});

    }catch(error){
        console.error("Error in verifyRegistrationOTP:", error);
        return res.status(500).json({success: false, message: "Verify Registration OTP Error"});
    }
}

const loginUser= async (req, res)=>{
    try{
        const {username, email, password, loginCredential}= req.body;

        let resolvedEmail = email ? email.trim().toLowerCase() : '';
        let resolvedUsername = username ? username.trim() : '';

        if(loginCredential && !resolvedEmail && !resolvedUsername){
            const trimmedCred = loginCredential.trim();
            if(trimmedCred.includes('@')){
                resolvedEmail = trimmedCred.toLowerCase();
            }else{
                resolvedUsername = trimmedCred;
            }
        }

        if((!resolvedEmail && !resolvedUsername) || !password) {
            return res.status(400).json({success: false, message: "Email or username and password are required"})
        }
        
        let user;
        if(resolvedEmail){
            if(!validator.isEmail(resolvedEmail)){
                return res.status(400).json({success: false, message: "Invalid email address"})
            }
            user= await User.findOne({email: resolvedEmail}).select('+password');
        }
        if(!user && resolvedUsername){
            user = await User.findOne({username: resolvedUsername}).select('+password');
        }
        if(!user){
            return res.status(401).json({success: false, message: "Invalid credentials"})
        }

        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({success: false, message: "Invalid credentials"})
        }

        if(!user.isActive){
            user.isActive= true;
            user.deactivatedAt= null;
            await user.save();
        }

        if(user.twoFactorEnabled){
            await issueOtp({
                email: user.email,
                purpose: LOGIN_2FA_OTP_PURPOSE,
                sendEmail: sendOtpEmailOrThrow,
                buildMailOptions: (otp, expiresInMinutes) => {
                    const mailTemplate = twoFactorTemplate(otp, expiresInMinutes, 'login verification');
                    return {
                        from: getSenderAddress("DevDash Security"),
                        to: user.email,
                        subject: mailTemplate.subject,
                        html: mailTemplate.html,
                    };
                },
            });

            return res.status(200).json({
                success: true,
                message: "2FA verification required",
                twoFactorRequired: true,
                twoFactorToken: createTwoFactorToken(user._id),
            });
        }

        const token= createToken(user._id);

        return res.status(200).json({success: true, message: "User login Successfully", token});
        
    }catch(error){
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error("Error in loginUser:", error);
        return res.status(500).json({success: false, message: "Error in Login User function"});
    }
}

const verifyLoginTwoFactor= async (req, res)=>{
    try{
        const {otp, twoFactorToken, email}= req.body;

        let userId = req.userId;

        if(!userId && twoFactorToken){
            const decoded = jwt.verify(twoFactorToken, JWT_SECRET_KEY);
            if(decoded.purpose !== 'login_2fa'){
                return res.status(401).json({success: false, message: "Invalid 2FA session"});
            }
            userId = decoded.id;
        }

        if(!otp){
            return res.status(400).json({success: false, message: "OTP is required"});
        }

        let user = null;

        if(userId){
            user = await User.findById(userId);
        }

        if(!user && email){
            user = await User.findOne({email});
        }
        
        if(!user){  
            return res.status(404).json({success: false, message: "User not found"});
        }

        const otpVerification = await verifyOtp({
            email: user.email,
            purpose: LOGIN_2FA_OTP_PURPOSE,
            otp,
        });

        if(!otpVerification.valid){
            if (otpVerification.reason === "expired") {
                return res.status(404).json({success: false, message: "OTP has expired. Please login again."});
            }
            if (otpVerification.reason === "invalid") {
                return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
            }
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }

        return res.status(200).json({success: true, message: "2FA verification successful", token: createToken(user._id)});

    }catch(error){
        console.error("Error in verifyLoginTwoFactor:", error);
        return res.status(500).json({success: false, message: "Error in Verify Login Two Factor Function"});
    }
}

const userInfo= async (req, res)=>{
    try{
        const userId= req.userId;
        
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        return res.status(200).json({success: true, message: "Fetched user info Successfully", user});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in User Info Function"});
    }
}

const forgetPasswordOTPRequest= async (req, res)=>{
    try{
        const rawEmail = req.body.email;
        if(!rawEmail){
            return res.status(400).json({success: false, message: "Email is required"});
        }

        const email = rawEmail.trim().toLowerCase();
        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Invalid email address"});
        }
        let user= await User.findOne({email});

        if(!user){
            return res.status(404).json({success: false, message: "User with this email not found"});
        }

        await issueOtp({
            email,
            purpose: FORGET_PASSWORD_OTP_PURPOSE,
            sendEmail: sendOtpEmailOrThrow,
            buildMailOptions: (otp, expiresInMinutes) => {
                const tmpl = forgetPasswordTemplate(otp, expiresInMinutes);
                return {
                    from: getSenderAddress("DevDash Support"),
                    to: email,
                    subject: tmpl.subject,
                    html: tmpl.html,
                };
            },
        });
        return res.status(200).json({success: true, message: "OTP sent to email successfully"});

    }catch(error){
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        return res.status(500).json({success: false, message: "Error in Forget Password OTP Request"});
    }
}

const verifyForgetPasswordOTPAndUpdate= async (req, res)=>{
    try{
        const {otp, newPass}= req.body;
        const rawEmail = req.body.email;
        if(!rawEmail || !newPass || !otp){
            return res.status(400).json({message: "All fields are required", success: false});
        }

        const email = rawEmail.trim().toLowerCase();

        if(newPass.length < 6){
            return res.status(400).json({success: false, message: "Password must be at least 6 characters"});
        }

        const user= await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User with this email not found", success: false});
        }

        const otpVerification = await verifyOtp({
            email,
            purpose: FORGET_PASSWORD_OTP_PURPOSE,
            otp,
        });

        if(!otpVerification.valid){
            if (otpVerification.reason === "expired") {
                return res.status(404).json({success: false, message: "OTP has expired. Please request a new one."});
            }
            if (otpVerification.reason === "invalid") {
                return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
            }
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }

        const hashPassword= await bcrypt.hash(newPass, 10);
        user.password= hashPassword;
        await user.save();


        const token= createToken(user._id);
        return res.status(200).json({success: true, message: "OTP verified successfully. Password updated.", token})

    }catch(error){
        console.error("Error in verifyForgetPasswordOTPAndUpdate:", error);
        return res.status(500).json({success: false, message: "Error in Verify Forget Password OTP and Update"});
    }
}

module.exports= {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    loginUser,
    verifyLoginTwoFactor,
    userInfo,
    forgetPasswordOTPRequest,
    verifyForgetPasswordOTPAndUpdate,
};