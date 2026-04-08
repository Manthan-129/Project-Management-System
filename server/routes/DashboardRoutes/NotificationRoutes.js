const express= require('express');
const notificationRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');

const {getMyNotifications, markNotificationRead, markAllNotificationsRead}= require('../../controllers/DashboardControllers/notificationControllers');

notificationRouter.use(authMiddleware);

notificationRouter.get('/', getMyNotifications);
notificationRouter.put('/mark-read/:notificationId', markNotificationRead);
notificationRouter.put('/mark-all-read', markAllNotificationsRead);

module.exports= notificationRouter;