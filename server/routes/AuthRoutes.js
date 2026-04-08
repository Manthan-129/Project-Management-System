const express= require('express');

const authRouter= express.Router();

const {
	loginUser,
	verifyLoginTwoFactor,
	sendRegistrationOTP,
	verifyRegistrationOTP,
	userInfo,
	forgetPasswordOTPRequest,
	verifyForgetPasswordOTPAndUpdate,
}= require('../controllers/AuthControllers');

const {authMiddleware}= require('../middlewares/authMiddlewares')

authRouter.post('/login', loginUser);
authRouter.post('/verify-login-2fa', verifyLoginTwoFactor);
authRouter.post('/send-registration-otp', sendRegistrationOTP)
authRouter.post('/verify-registration-otp', verifyRegistrationOTP)
authRouter.get('/user-info', authMiddleware, userInfo)
authRouter.post('/forget-password-otp-request', forgetPasswordOTPRequest)
authRouter.post('/verify-change-pass-otp', verifyForgetPasswordOTPAndUpdate)

module.exports= {authRouter};
