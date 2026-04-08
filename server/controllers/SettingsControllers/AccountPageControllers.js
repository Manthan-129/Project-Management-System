require('dotenv').config();

const User = require('../../models/User');
const OTP= require('../../models/OTP');
const bcrypt= require('bcrypt');
const validator= require('validator');
const { transporter }= require('../../configs/nodemailer');
const { updateEmailTemplate }= require('../../utils/emailTemplates.js');

const updateUserEmailOTPRequest= async (req, res)=>{
    try{
        const userId= req.userId;
        const {newEmail}= req.body;
        
        if(!newEmail){
            return res.status(404).json({success: false, message: "New email is required"});
        }

        if(!validator.isEmail(newEmail)){
            return res.status(404).json({success: false, message: "Invalid email address"});
        }

        const user= await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const existingUser= await User.findOne({email: newEmail});

        if(existingUser){
            return res.status(404).json({success: false, message: "Email is already in use by another account"});
        }

        const otp= Math.floor(100000 + Math.random()*900000).toString();

        const otpHash= await bcrypt.hash(otp, 10);

        await OTP.deleteMany({email: newEmail, purpose: process.env.UPDATE_EMAIL_PURPOSE});
        await OTP.create({
            email: newEmail,
            purpose: process.env.UPDATE_EMAIL_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 5*60*1000),
        });

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: newEmail,
            subject: updateEmailTemplate(otp,5).subject,
            text: updateEmailTemplate(otp,5).html.replace(/<[^>]+>/g, ''),
            html: updateEmailTemplate(otp,5).html, 
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({success: true, message: "OTP sent to new email for verification"});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Update User Email OTP Request"});
    }
}

const verifyUpdateUserEmailOTP= async (req, res)=>{
    try{
        const userId= req.userId;
        const {password, newEmail, otp}= req.body;
        
        if(!password){
            return res.status(404).json({success: false, message: "Password is required for verifying email update"});
        }
        
        if(!newEmail || !otp){
            return res.status(404).json({success: false, message: "New email and OTP are required"});
        }
        if(!validator.isEmail(newEmail)){
            return res.status(404).json({success: false, message: "Invalid email address"});
        }

        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(404).json({success: false, message: "Incorrect password. Cannot verify email update."});
        }
        

        const otpRecord= await OTP.findOne({email: newEmail, purpose: process.env.UPDATE_EMAIL_PURPOSE}).sort({createdAt: -1});

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

        user.email= newEmail;

        await user.save();
        await OTP.deleteOne({_id: otpRecord._id});

        return res.status(200).json({success: true, message: "Email updated successfully"});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Verify Update User Email OTP"});
    }
}

const deactivateUserAccount= async (req, res)=>{
    try{
        const userId= req.userId;

        const {password}= req.body;
        
        if(!password){
            return res.status(404).json({success: false, message: "Password is required for deactivating account"});
        }

        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch= await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(404).json({success: false, message: "Incorrect password. Cannot deactivate account."});
        }

        if(!user.isActive){
            return res.status(400).json({success: false, message: "Account is already deactivated"});
        }

        user.isActive= false;
        user.deactivatedAt= new Date();

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Account deactivated successfully. For reactivation, please login again.",
            deactivatedAt: user.deactivatedAt,
        });

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Deactivate User Account"});
    }
}

const deleteUserAccount= async (req, res)=>{
    try{
        const userId= req.userId;
        const {password}= req.body;

        if(!password){
            return res.status(404).json({success: false, message: "Password is required for deleting account"});
        }
        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(404).json({success: false, message: "Incorrect password. Cannot delete account."});
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({success: true, message: "Account deleted successfully"});
        
    }catch(error){
        return res.status(500).json({success: false, message: "Error in Delete User Account"});
    }
}


module.exports= { updateUserEmailOTPRequest, verifyUpdateUserEmailOTP, deactivateUserAccount, deleteUserAccount };