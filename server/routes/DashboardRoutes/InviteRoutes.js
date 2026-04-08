const express= require('express');
const inviteRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');

const {sendRequestToMakeFriend, getMyInvitationsReceived, getMyInvitationsSent, respondToFriendRequest, cancelSentFriendRequest, unfriendUser, allFriends}= require('../../controllers/DashboardControllers/inviteControllers');

inviteRouter.use(authMiddleware);

inviteRouter.post('/invitations/send-request', sendRequestToMakeFriend);
inviteRouter.get('/invitations/received', getMyInvitationsReceived);
inviteRouter.get('/invitations/sent', getMyInvitationsSent);
inviteRouter.post('/invitations/respond-request/:inviteId', respondToFriendRequest);
inviteRouter.delete('/invitations/cancel-request/:inviteId', cancelSentFriendRequest);
inviteRouter.post('/invitations/cancel-request/:inviteId', cancelSentFriendRequest);
inviteRouter.post('/unfriend/:friendId', unfriendUser);
inviteRouter.get('/friends', allFriends);

module.exports= inviteRouter;