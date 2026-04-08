require('dotenv').config();

const User= require("../../models/User");
const OTP= require("../../models/OTP");
const bcrypt= require("bcrypt");
const {transporter}= require("../../configs/nodemailer");
const {twoFactorTemplateEnable, twoFactorTemplateDisable}= require("../../utils/emailTemplates");

const TWO_FACTOR_ENABLE_PURPOSE = process.env.TWO_FACTOR_ENABLE_PURPOSE || 'two-factor-enable';
const TWO_FACTOR_DISABLE_PURPOSE = process.env.TWO_FACTOR_DISABLE_PURPOSE || 'two-factor-disable';
const TWO_FACTOR_OTP_EXPIRY_MINUTES = Number(process.env.TWO_FACTOR_OTP_EXPIRY_MINUTES || 5);

const changePasswordOfUser = async (req, res)=>{
    try{
        const userId= req.userId;
        const {currentPassword, newPassword}= req.body;

        if(!currentPassword || !newPassword){
            return res.status(400).json({success: false, message: "Current and new password are required"});
        }

        if(newPassword.length < 8){
            return res.status(400).json({success: false, message: "New password must be at least 8 characters"});
        }

        if(currentPassword === newPassword){
            return res.status(400).json({success: false, message: "New password must be different from current password"});
        }

        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch= await bcrypt.compare(currentPassword, user.password);

        if(!isMatch){
            return res.status(401).json({success: false, message: "Current password is incorrect"});
        }

        const hashNewPassword= await bcrypt.hash(newPassword, 10);
        user.password= hashNewPassword;

        await user.save();

        return res.status(200).json({success: true, message: "Password changed successfully"});
    }catch(error){
        return res.status(500).json({success: false, message: "Error in Change Password Function"});
    }
};

const getTwoFactorStatus= async (req, res)=>{
    try{
        const userId= req.userId;
        const user= await User.findById(userId).select("twoFactorEnabled");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        return res.status(200).json({success: true, twoFactorEnabled: user.twoFactorEnabled});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Get Two Factor Status Function"});
    }
}

const setupTwoFactorAuthentication= async (req, res)=>{
    try{
        const userId= req.userId;
        const user= await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        if(user.twoFactorEnabled){
            return res.status(400).json({success: false, message: "Two-factor authentication is already enabled"});
        }

        const otp= Math.floor(100000 + Math.random() * 900000).toString();

        const otpHash= await bcrypt.hash(otp, 10);

        await OTP.deleteMany({email: user.email, purpose: TWO_FACTOR_ENABLE_PURPOSE});

        await OTP.create({
            email: user.email,
            purpose: TWO_FACTOR_ENABLE_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + TWO_FACTOR_OTP_EXPIRY_MINUTES*60*1000),
        })

        const template = twoFactorTemplateEnable(otp, TWO_FACTOR_OTP_EXPIRY_MINUTES);

        await transporter.sendMail({
            from: `"Security" <${process.env.SENDER_EMAIL}>`,
            to: user.email,
            subject: template.subject,
            text: template.html.replace(/<[^>]+>/g, ''),
            html: template.html,
        });

        return res.status(200).json({success: true, message: "OTP sent to email for 2FA setup"});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Setup Two Factor Authentication Function"});
    }
}

const verifyAndEnableTwoFactorAuthentication= async (req, res)=>{
    try{
        const userId= req.userId;
        const {otp} = req.body;

        if(!otp){
            return res.status(400).json({success: false, message: "OTP is required"});
        }
        const user= await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        if(user.twoFactorEnabled){
            return res.status(400).json({success: false, message: "Two-factor authentication is already enabled"});
        }

        const otpRecord= await OTP.findOne({email: user.email, purpose: TWO_FACTOR_ENABLE_PURPOSE}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(400).json({success: false, message: "No OTP request found for enabling 2FA"});
        }

        if(otpRecord.expiresAt < new Date()){
            await OTP.deleteOne({_id: otpRecord._id});
            return res.status(400).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        const isMatch= await bcrypt.compare(otp, otpRecord.otp);

        if(!isMatch){
            return res.status(400).json({success: false, message: "Invalid OTP"});
        }

        user.twoFactorEnabled= true;
        await user.save();

        await OTP.deleteOne({_id: otpRecord._id});

        return res.status(200).json({success: true, message: "Two-factor authentication enabled successfully"});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Verify and Enable Two Factor Authentication Function"});
    }
}

const disableTwoFactorAuthentication= async (req, res)=>{
    try{
        const userId= req.userId;

        
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        if(!user.twoFactorEnabled){
            return res.status(400).json({success: false, message: "Two-factor authentication is not enabled"});
        }

        const otp= Math.floor(100000 + Math.random() * 900000).toString();
        
        const otpHash= await bcrypt.hash(otp, 10);

        await OTP.deleteMany({email: user.email, purpose: TWO_FACTOR_DISABLE_PURPOSE});

        await OTP.create({
            email: user.email,
            purpose: TWO_FACTOR_DISABLE_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + TWO_FACTOR_OTP_EXPIRY_MINUTES*60*1000),
        })

        const template = twoFactorTemplateDisable(otp, TWO_FACTOR_OTP_EXPIRY_MINUTES);

        await transporter.sendMail({
            from: `"Security" <${process.env.SENDER_EMAIL}>`,
            to: user.email,
            subject: template.subject,
            text: template.html.replace(/<[^>]+>/g, ''),
            html: template.html,
        })

        return res.status(200).json({success: true, message: "OTP sent to email for 2FA disable"});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Disable Two Factor Authentication Function"});
    }
}

const verifyAndDisableTwoFactorAuthentication= async (req, res)=>{
    try{
        const userId= req.userId;
        const {otp}= req.body;

        if(!otp){
            return res.status(400).json({success: false, message: "OTP is required"});
        }

        const user= await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        if(!user.twoFactorEnabled){
            return res.status(400).json({success: false, message: "Two-factor authentication is not enabled"});
        }

        const otpRecord= await OTP.findOne({email: user.email, purpose: TWO_FACTOR_DISABLE_PURPOSE}).sort({createdAt: -1});

        if(!otpRecord){
            return res.status(400).json({success: false, message: "No OTP request found for disabling 2FA"});
        }

        if(otpRecord.expiresAt < new Date()){
            await OTP.deleteOne({_id: otpRecord._id});
            return res.status(400).json({success: false, message: "OTP has expired. Please request a new one."});
        }

        const isMatch= await bcrypt.compare(otp, otpRecord.otp);

        if(!isMatch){
            return res.status(400).json({success: false, message: "Invalid OTP"});
        }

        user.twoFactorEnabled= false;
        await user.save();
        
        await OTP.deleteOne({_id: otpRecord._id});

        return res.status(200).json({success: true, message: "Two-factor authentication disabled successfully"});
        
    }catch(error){
        return res.status(500).json({success: false, message: "Error in Verify and Disable Two Factor Authentication Function"});
    }
}

module.exports= {
    changePasswordOfUser,
    getTwoFactorStatus,
    setupTwoFactorAuthentication,
    verifyAndEnableTwoFactorAuthentication,
    disableTwoFactorAuthentication,
    verifyAndDisableTwoFactorAuthentication,
};
