const express= require('express');
const pullRequestRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');

const {createPullRequest, reviewPullRequest, getTeamPullRequests, getMyPullRequests}= require('../../controllers/DashboardControllers/pullRequestControllers');

pullRequestRouter.use(authMiddleware);

pullRequestRouter.post('/create/:taskId', createPullRequest);
pullRequestRouter.post('/review/:pullRequestId', reviewPullRequest);
pullRequestRouter.get('/team/:teamId', getTeamPullRequests);
pullRequestRouter.get('/my-pull-requests', getMyPullRequests);

module.exports= pullRequestRouter;