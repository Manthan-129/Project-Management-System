const express= require('express');
const taskRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');

const {createTask, getTeamTasks, getMyTasksInTeam, getMyTasks, updateTaskStatus, updateTask, deleteTask, restoreTask, getWorkspaceTaskBoard, getTeamMemberProgress}= require('../../controllers/DashboardControllers/taskControllers');

taskRouter.use(authMiddleware);

taskRouter.post('/create/:teamId/:assignedTo', createTask);
taskRouter.get('/team-task/:teamId', getTeamTasks);
taskRouter.get('/my-tasks-in-team/:teamId', getMyTasksInTeam);
taskRouter.get('/my-tasks', getMyTasks);
taskRouter.patch('/update-status/:taskId', updateTaskStatus);
taskRouter.put('/update/:taskId', updateTask);
taskRouter.put('/:taskId', deleteTask);
taskRouter.patch('/restore/:taskId', restoreTask);
taskRouter.get('/workspace-board', getWorkspaceTaskBoard);
taskRouter.get('/team-member-progress/:teamId', getTeamMemberProgress);

module.exports= taskRouter;