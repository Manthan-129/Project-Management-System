const express= require('express');
const taskRouter= express.Router();

const { authMiddleware }= require('../../middlewares/authMiddlewares');

const {createTask, getTeamTasks, getMyTasksInTeam, getMyTasks, updateTaskStatus, updateTask, deleteTask, restoreTask, getWorkspaceTaskBoard, getTeamMemberProgress}= require('../../controllers/DashboardControllers/taskControllers');

taskRouter.use(authMiddleware);

taskRouter.post('/create', createTask);
taskRouter.post('/create/:teamId/:assignedTo', createTask);
taskRouter.get('/team-task/:teamId', getTeamTasks);
taskRouter.get('/my-tasks-in-team/:teamId', getMyTasksInTeam);
taskRouter.get('/my-tasks', getMyTasks);
taskRouter.patch('/update-status/:taskId', updateTaskStatus);
taskRouter.put('/update-status/:taskId', updateTaskStatus);
taskRouter.put('/update/:taskId', updateTask);
taskRouter.patch('/update/:taskId', updateTask);
taskRouter.delete('/delete/:taskId', deleteTask);
taskRouter.patch('/delete/:taskId', deleteTask);
taskRouter.put('/:taskId', deleteTask);
taskRouter.patch('/restore/:taskId', restoreTask);
taskRouter.put('/restore/:taskId', restoreTask);
taskRouter.get('/workspace-board', getWorkspaceTaskBoard);
taskRouter.get('/team-member-progress/:teamId', getTeamMemberProgress);

module.exports= taskRouter;