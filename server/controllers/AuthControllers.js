require('dotenv').config();

const User = require('../models/User');
const OTP= require('../models/OTP');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
const validator= require('validator');
const {transporter}= require('../configs/nodemailer');
const {registrationTemplate, forgetPasswordTemplate, twoFactorTemplate}= require('../utils/emailTemplates.js');

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const REGISTRATION_OTP_PURPOSE = process.env.OTP_PURPOSE_REGISTRATION || 'registration';
const LOGIN_2FA_OTP_PURPOSE = process.env.OTP_PURPOSE_LOGIN_2FA || 'login_2fa';
const FORGET_PASSWORD_OTP_PURPOSE = process.env.OTP_PURPOSE_FORGET_PASSWORD || 'forget_password';

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
        const {email, username}= req.body;
        
        if(!email && !username){
            return res.status(400).json({success: false, message: "Email and username are required"});
        }
        // Validate email and username
        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Please enter a valid email address"});
        }

        const existingUserByEmail= await User.findOne({email});
        if(existingUserByEmail){
            return res.status(400).json({success: false, message: "Email is already registered"});
        }
        const existingUserByUsername= await User.findOne({username});
        if(existingUserByUsername){
            return res.status(400).json({success: false, message: "Username is already taken"});
        }

        // Generate OTP and send email
        const otp = Math.floor(100000 + Math.random()*900000).toString();
        const otpHash= await bcrypt.hash(otp, 10);
        
        await OTP.deleteMany({ email, purpose: REGISTRATION_OTP_PURPOSE });
        
        await OTP.create({
            email,
            purpose: REGISTRATION_OTP_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 5*60*1000), // OTP valid for 5 minutes
        });

        const mailOptions= {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: registrationTemplate(otp, 5).subject,
            text: registrationTemplate(otp, 5).html.replace(/<[^>]+>/g, ''), // Plain text version
            html: registrationTemplate(otp, 5).html,
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({success: true, message: "OTP sent to email successfully"});

    }catch(error){
        console.error("Error in registrationOTP:", error);
        return res.status(500).json({success: false, message: "Send OTP for Signup Error"});
    }
}

// Complete registration after OTP verification

const verifyRegistrationOTP= async (req, res)=>{
    try{
        const {email, username, password, otp, firstName, lastName}=  req.body;

        if(!email || !username || !password || !otp || !firstName || !lastName){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Please enter a valid email address"});
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if(existingUser){
            return res.status(409).json({success: false, message: "Email or username is already in use"});
        }
        
        const otpRecord = await OTP.findOne({email, purpose: REGISTRATION_OTP_PURPOSE}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }
        
        if(otpRecord.expiresAt < new Date()){
            return res.status(404).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        const isOTPValid= await bcrypt.compare(otp, otpRecord.otp);

        if(!isOTPValid){
            return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
        }

        const hashPassword= await bcrypt.hash(password, 10);

        const newUser= await User.create({
            firstName, lastName, email, username, password: hashPassword
        });

        await OTP.deleteOne({_id: otpRecord._id});

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

        let resolvedEmail = email;
        let resolvedUsername = username;

        if(loginCredential && !resolvedEmail && !resolvedUsername){
            if(loginCredential.includes('@')){
                resolvedEmail = loginCredential;
            }else{
                resolvedUsername = loginCredential;
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
            const loginOtp= Math.floor(100000 + Math.random()*900000).toString();
            const loginOtpHash= await bcrypt.hash(loginOtp, 10);

            await OTP.deleteMany({email: user.email, purpose: LOGIN_2FA_OTP_PURPOSE});
            await OTP.create({
                email: user.email,
                purpose: LOGIN_2FA_OTP_PURPOSE,
                otp: loginOtpHash,
                expiresAt: new Date(Date.now() + 5*60*1000),
            });

            const mailTemplate= twoFactorTemplate(loginOtp, 5, 'login verification');

            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: mailTemplate.subject,
                text: mailTemplate.html.replace(/<[^>]+>/g, ''),
                html: mailTemplate.html,
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

        const otpRecord = await OTP.findOne({email: user.email, purpose: LOGIN_2FA_OTP_PURPOSE}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }
        if(otpRecord.expiresAt < new Date()){
            return res.status(404).json({success: false, message: "OTP has expired. Please login again."});
        }

        const isOTPValid= await bcrypt.compare(otp, otpRecord.otp);

        if(!isOTPValid){
            return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
        }

        await OTP.deleteOne({_id: otpRecord._id});

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
        const {email}= req.body;
        if(!email){
            return res.status(400).json({success: false, message: "Email is required"});
        }
        if(!validator.isEmail(email)){
            return res.status(400).json({success: false, message: "Invalid email address"});
        }
        let user= await User.findOne({email});

        if(!user){
            return res.status(404).json({success: false, message: "User with this email not found"});
        }

        const otp= Math.floor(100000 + Math.random()*900000).toString();
        const otpHash= await bcrypt.hash(otp, 10);

        await OTP.deleteMany({email, purpose: FORGET_PASSWORD_OTP_PURPOSE});
        await OTP.create({
            email,
            purpose: FORGET_PASSWORD_OTP_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 5*60*1000),
        })

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: email,
            subject: forgetPasswordTemplate(otp, 5).subject,
            text: forgetPasswordTemplate(otp, 5).html.replace(/<[^>]+>/g, ''),
            html: forgetPasswordTemplate(otp,5).html,
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({success: true, message: "OTP sent to email for password reset"})

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Forget Password OTP Request"});
    }
}

const verifyForgetPasswordOTPAndUpdate= async (req, res)=>{
    try{
        const {otp, newPass, email}= req.body;
        if(!email || !newPass || !otp){
            return res.status(400).json({message: "All fields are required", success: false});
        }

        if(newPass.length < 6){
            return res.status(400).json({success: false, message: "Password must be at least 6 characters"});
        }

        const user= await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User with this email not found", success: false});
        }

        const otpRecord = await OTP.findOne({email, purpose: FORGET_PASSWORD_OTP_PURPOSE}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }
        
        if(otpRecord.expiresAt < new Date()){
            return res.status(404).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        const isOTPValid= await bcrypt.compare(otp, otpRecord.otp);

        if(!isOTPValid){
            return res.status(400).json({success: false, message: "Invalid OTP. Please try again."});
        }

        const hashPassword= await bcrypt.hash(newPass, 10);
        user.password= hashPassword;
        await user.save();

        await OTP.deleteOne({_id: otpRecord._id});

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