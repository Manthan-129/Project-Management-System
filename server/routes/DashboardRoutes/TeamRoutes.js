const express= require('express');
const teamRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');


const {createTeam, getMyTeams, getTeamDetails, sendTeamInvitation, getReceivedTeamInvitations, getSentInvitationsByMe, getSentInvitationsByTeam, respondToTeamInvitation, makeUserAdminOrMember, allMemberOfTeam, removeTeamMember, leaveTeam, deleteTeam, transferLeadership}= require('../../controllers/DashboardControllers/teamControllers');

teamRouter.use(authMiddleware);

teamRouter.post('/create', createTeam);
teamRouter.get('/my-teams', getMyTeams);
teamRouter.get('/:teamId', getTeamDetails);
teamRouter.post('/invitations/send/:teamId', sendTeamInvitation);
teamRouter.get('/invitations/received', getReceivedTeamInvitations);
teamRouter.get('/invitations/sent-by-me', getSentInvitationsByMe);
teamRouter.get('/invitations/sent-by-team', getSentInvitationsByTeam);
teamRouter.put('/invitations/respond/:invitationId', respondToTeamInvitation);
teamRouter.patch('/change-role/:teamId/:memberId', makeUserAdminOrMember);
teamRouter.get('/all-members/:teamId', allMemberOfTeam);
teamRouter.delete('/remove-member/:teamId/:memberId', removeTeamMember);
teamRouter.delete('/leave/:teamId', leaveTeam);
teamRouter.delete('/delete/:teamId', deleteTeam);
teamRouter.post('/transfer-leadership/:teamId/:newLeaderId', transferLeadership);

module.exports= teamRouter;

