require('dotenv').config();

const User = require('../models/User');
const OTP= require('../models/OTP');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
const validator= require('validator');
const {transporter}= require('../configs/nodemailer');
const {registrationTemplate, forgetPasswordTemplate, twoFactorTemplate}= require('../utils/emailTemplates.js');

// Create a Token 
const createToken = (id)=>{
    const token= jwt.sign({id}, process.env.JWT_SECRET_KEY, {expiresIn: '7d'});
    return token;

}

// Register a new user
const sendRegistrationOTP= async (req, res)=>{
    try{
        const {email, username}= req.body;
        console.log(process.env.SENDER_EMAIL);
        
        if(!email || !username){
            return res.status(400).json({success: false, message: "Email and username are required"});
        }
        // Validate email and username
        if(!validator.isEmail(email)){
            return res.status(404).json({success: false, message: "Please enter a valid email address"});
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
        
        await OTP.deleteMany({ email, purpose: process.env.OTP_PURPOSE_REGISTRATION });
        
        await OTP.create({
            email,
            purpose: process.env.OTP_PURPOSE_REGISTRATION,
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
            return res.status(404).json({success: false, message: "All fields are required"});
        }
        
        const otpRecord = await OTP.findOne({email, purpose: process.env.OTP_PURPOSE_REGISTRATION}).sort({createdAt: -1});

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
        const {username, email, password}= req.body;

        if((!email && !username) || !password) {
            return res.status(404).json({success: false, message: "Email or username and password are required"})
        }
        
        let user;
        if(email){
            if(!validator.isEmail(email)){
                return res.status(404).json({success: false, message: "Invalid email address"})
            }
            user= await User.findOne({email}).select('+password');
        }
        if(username){
            user = await User.findOne({username}).select('+password');
        }
        if(!user){
            return res.status(404).json({success: false, message: "User not found."})
        }

        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(404).json({success: false, message: "Invalid credentials"})
        }

        if(!user.isActive){
            user.isActive= true;
            user.deactivatedAt= null;
            await user.save();
        }

        if(user.twoFactorEnabled){
            const loginOtp= Math.floor(100000 + Math.random()*900000).toString();
            const loginOtpHash= await bcrypt.hash(loginOtp, 10);

            await OTP.deleteMany({email: user.email, purpose: process.env.OTP_PURPOSE_LOGIN_2FA});
            await OTP.create({
                email: user.email,
                purpose: process.env.OTP_PURPOSE_LOGIN_2FA,
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
            });
        }

        const token= createToken(user._id);

        return res.status(200).json({success: true, message: "User login Successfully", token});
        
    }catch(error){
        return res.status(500).json({success: false, message: "Error in Login User function"});
    }
}

const verifyLoginTwoFactor= async (req, res)=>{
    try{
        const userId= req.userId;
        const {otp}= req.body;

        if(!otp){
            return res.status(404).json({success: false, message: "OTP is required"});
        }

        const user= await User.findById(userId);
        
        if(!user){  
            return res.status(404).json({success: false, message: "User not found"});
        }

        const otpRecord = await OTP.findOne({email: user.email, purpose: process.env.OTP_PURPOSE_LOGIN_2FA});

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
            return res.status(404).json({success: false, message: "Email is required"});
        }
        if(!validator.isEmail(email)){
            return res.status(404).json({success: false, message: "Invalid email address"});
        }
        let user= await User.findOne({email});

        if(!user){
            return res.status(404).json({success: false, message: "User with this email not found"});
        }

        const otp= Math.floor(100000 + Math.random()*900000).toString();
        const otpHash= await bcrypt.hash(otp, 10);

        await OTP.deleteMany({email, purpose: process.env.OTP_PURPOSE_FORGET_PASSWORD});
        await OTP.create({
            email,
            purpose: process.env.OTP_PURPOSE_FORGET_PASSWORD,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 5*60*1000),
        })

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}`,
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
            return res.status(404).json({message: "All feilds are required", success: false});
        }

        const user= await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User with this email not found", success: false});
        }

        const otpRecord = await OTP.findOne({email, purpose: process.env.OTP_PURPOSE_FORGET_PASSWORD}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(404).json({success: false, message: "OTP expired or invalid"});
        }
        
        if(otpRecord.expiresAt < new Date()){
            return res.status(404).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        const isOTPValid= await bcrypt.compare(otp, otpRecord.otp);

        if(!isOTPValid){
            return res.status(404).json({success: false, message: "Invalid OTP. Please try again."});
        }

        const hashPassword= await bcrypt.hash(newPass, 10);
        user.password= hashPassword;
        await user.save();

        await OTP.deleteOne({_id: otpRecord._id});

        const token= createToken(user._id);
        return res.status(200).json({success: true, message: "OTP verified successfully. Password updated.", token})

    }catch(error){
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