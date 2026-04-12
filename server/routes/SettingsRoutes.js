const express= require('express')

const settingsRouter= express.Router();

const { updateUserInfo }= require('../controllers/SettingsControllers/ProfilePageControllers');

const { updateUserEmailOTPRequest, verifyUpdateUserEmailOTP, deactivateUserAccount, deleteUserAccount }= require('../controllers/SettingsControllers/AccountPageControllers');

const { getPrivacySettings, updatePrivacySettings }= require('../controllers/SettingsControllers/PrivacyPageControllers');

const { getAppearanceSettings, updateAppearanceSettings }= require('../controllers/SettingsControllers/AppearanceControllers');

const {
	changePasswordOfUser,
	getTwoFactorStatus,
	setupTwoFactorAuthentication,
	verifyAndEnableTwoFactorAuthentication,
	disableTwoFactorAuthentication,
	verifyAndDisableTwoFactorAuthentication,
}= require('../controllers/SettingsControllers/SecurityPageControllers');

const {
	getIntegrationStatus,
	initiateIntegrationConnection,
	handleIntegrationCallback,
	disconnectIntegration,
	toggleIntegrationAutoSync,
}= require('../controllers/SettingsControllers/IntegrationPageControllers');

const { getNotificationSettings, updateNotificationSettings }= require('../controllers/SettingsControllers/NotificationPageControllers');

const {authMiddleware}= require('../middlewares/authMiddlewares');

const { uploader }= require('../middlewares/multer');

// ProfilePage.jsx file
settingsRouter.patch('/update-user-info', authMiddleware, uploader.single('profilePicture'), updateUserInfo);

// AccountPage.jsx file
settingsRouter.post('/update-email-otp-request', authMiddleware, updateUserEmailOTPRequest);
settingsRouter.post('/verify-update-email-otp', authMiddleware, verifyUpdateUserEmailOTP);
settingsRouter.post('/deactivate-account', authMiddleware, deactivateUserAccount);
settingsRouter.delete('/delete-account', authMiddleware, deleteUserAccount);

// PrivacyPage.jsx file
settingsRouter.get('/get-privacy-settings', authMiddleware, getPrivacySettings);
settingsRouter.put('/update-privacy-settings', authMiddleware, updatePrivacySettings);

// AppearancePage.jsx file
settingsRouter.get('/get-appearance-settings', authMiddleware, getAppearanceSettings);
settingsRouter.put('/update-appearance-settings', authMiddleware, updateAppearanceSettings);

// SecurityPage.jsx file
settingsRouter.patch('/change-password', authMiddleware, changePasswordOfUser);
settingsRouter.get('/2fa-status', authMiddleware, getTwoFactorStatus);
settingsRouter.post('/2fa-setup', authMiddleware, setupTwoFactorAuthentication);
settingsRouter.post('/2fa-verify-enable', authMiddleware, verifyAndEnableTwoFactorAuthentication);
settingsRouter.post('/2fa-disable', authMiddleware, disableTwoFactorAuthentication);
settingsRouter.post('/2fa-verify-disable', authMiddleware, verifyAndDisableTwoFactorAuthentication);

// IntegrationPage.jsx file
settingsRouter.get('/integrations/status', authMiddleware, getIntegrationStatus);
settingsRouter.get('/integrations/:platform/connect', authMiddleware, initiateIntegrationConnection);
settingsRouter.get('/integrations/:platform/callback', handleIntegrationCallback);
settingsRouter.post('/integrations/:platform/disconnect', authMiddleware, disconnectIntegration);
settingsRouter.post('/integrations/:platform/toggle-sync', authMiddleware, toggleIntegrationAutoSync);

// NotificationPage.jsx file
settingsRouter.get('/get-notification-settings', authMiddleware, getNotificationSettings);
settingsRouter.put('/update-notification-settings', authMiddleware, updateNotificationSettings);

module.exports= settingsRouter;