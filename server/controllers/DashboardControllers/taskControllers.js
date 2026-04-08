const Team = require('../../models/Team');
const Task= require('../../models/Task');
const User= require('../../models/User');
const { transporter }= require('../../configs/nodemailer');
const {updateTaskTemplate, taskAssignmentTemplate}= require('../../utils/emailTemplates');
const { createNotification, createNotifications } = require('../../utils/notificationService.js');

const createTask= async (req, res) => {
    try{
        const userId= req.userId;

        const userIdStr= userId.toString();

        const {assignedTo, teamId}= req.params;

        const assignedToStr= assignedTo.toString();

        const {title, description, priority, dueDate}= req.body;

        if(!title || !assignedTo || !teamId){
            return res.status(400).json({success: false, message: 'Title, assignedTo and teamId are required' });
        }

        if(!['Low', 'Medium', 'High'].includes(priority)){
            return res.status(400).json({success: false, message: 'Invalid priority value' });
        }

        const trimmedTitle= title.trim();

        if(trimmedTitle.length < 3 || trimmedTitle.length > 50){
            return res.status(400).json({success: false, message: 'Title must be between 3 and 50 characters' });
        }

        const team= await Team.findById(teamId).select('leader members name ').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isLeader=  team.leader.toString() === userIdStr;
        const isAdmin= team.members.some(m => m.user.toString() === userIdStr && m.role === 'admin');

        if(!isAdmin && !isLeader){
            return res.status(403).json({success: false, message: 'Only team leader or admins can create tasks' });
        }

        const isReceiverLeader= team.leader.toString() === assignedToStr;
        const isReceiverMember= team.members.some(m => m.user.toString() === assignedToStr);

        if(isAdmin && isReceiverLeader){
            return res.status(400).json({success: false, message: 'Admins cannot assign tasks to the team leader' });
        }

        if(!isReceiverMember){
            return res.status(400).json({success: false, message: 'Assigned user must be a member of the team' });
        }

        const newTask= await Task.create({
            title: trimmedTitle,
            description: description ? description.trim() : '',
            priority: priority || 'Medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignedTo,
            assignedBy: userId,
            team: teamId,
        })

        await newTask
        .populate('assignedTo', 'username firstName lastName profilePicture email').
        populate('assignedBy', 'username firstName lastName profilePicture email');

        
        const actorName = `${newTask.assignedBy.firstName} ${newTask.assignedBy.lastName}`.trim();

        try{
            const teamMemberRecipients = new Set([
                team.leader.toString(),
                ...team.members.map((member) => member.user.toString()),
            ]);

            const taskAddedNotifications = Array.from(teamMemberRecipients)
                .filter((recipientId) => recipientId !== userId)
                .map((recipientId) => ({
                    recipient: recipientId,
                    actor: userId,
                    type: 'task-added',
                    title: 'Task added',
                    message: `${actorName} added a new task: ${newTask.title}`,
                    metadata: { taskId: newTask._id, teamId: team._id, teamName: team.name },
                }));

            await createNotifications(taskAddedNotifications);
        }catch(error){
            console.log('Error creating task added notifications:', error.message);
        }

        try{
            const taskAssignmentNotification = taskAssignmentTemplate({
            title: newTask.title,
            description: newTask.description,
            status: newTask.status,
            priority: newTask.priority,
            dueDate: newTask.dueDate,
            assignedBy: actorName,
            assignedTo: newTask.assignedTo.firstName + ' ' + newTask.assignedTo.lastName
        })
        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: newTask.assignedTo.email,
            subject: taskAssignmentNotification.subject,
            text: taskAssignmentNotification.html.replace(/<[^>]+>/g, ''),
        }

        await transporter.sendMail(mailOptions);
        }catch(error){
            console.log('Error sending task assignment email:', error.message);
        }

        return res.status(201).json({success: true, message: "Task created successfully", task: newTask});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while creating task' });
    }
}

// Used in the TeamDetails.jsc file for kanban board, and displays all tasks of the team in different columns based on their status or in Dashboard too.
const getTeamTasks= async (req, res) => {
    try{
        const userId= req.userId;

        const {teamId}= req.params;

        const team= await Team.findById(teamId).select('leader members').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isMember= team.leader.toString() === userId.toString() || team.members.some(m => m.user.toString() === userId.toString());

        if(!isMember){
            return res.status(403).json({success: false, message: 'Only team members can view tasks' });
        }

        const tasks= await Task.find({team: teamId})
        .populate('assignedTo', 'username firstName lastName profilePicture email')
        .populate('assignedBy', 'username firstName lastName profilePicture email')
        .populate('deletedBy', 'username firstName lastName profilePicture email')
        .sort({createdAt: -1})
        .lean();

        const nowDate= new Date();

        const kanbanBoard= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
        }

        const stats= {
            total: 0,
            byStatus: {
                todo: 0,
                'in-progress': 0,
                'in-review': 0,
                completed: 0,
            },
            byPriority: {
                high: 0,
                medium: 0,
                low: 0,
            },
            overDue: 0,
        }

        const activeTasks= [];
        const deletedTasks= [];

        const taskByMember= {};

        for(const t of tasks){
            if(t.isDeleted){
                deletedTasks.push(t);
                kanbanBoard.deleted.push(t);
                continue;
            }
            activeTasks.push(t);

            if (kanbanBoard[t.status]) {
                kanbanBoard[t.status].push(t);
                stats.byStatus[t.status]++;
            }

            stats.total++;
            stats.byPriority[t.priority.toLowerCase()]++;

            const memberId= t.assignedTo._id.toString();
            if(!taskByMember[memberId]){
                taskByMember[memberId]= {
                    memberInfo: {
                        _id: memberId,
                        firstName: t.assignedTo.firstName,
                        lastName: t.assignedTo.lastName,
                        username: t.assignedTo.username,
                        profilePicture: t.assignedTo.profilePicture,
                    },
                    tasks: [],
                    stats: {
                        total: 0,
                        byStatus: {
                            todo: 0,
                            'in-progress': 0,
                            'in-review': 0,
                            completed: 0,
                        },
                        byPriority: {
                            high: 0,
                            medium: 0,
                            low: 0,
                        },
                        overDue: 0,
                    }
                }
            }

            taskByMember[memberId].tasks.push(t);
            taskByMember[memberId].stats.total++;
            taskByMember[memberId].stats.byStatus[t.status]++;
            taskByMember[memberId].stats.byPriority[t.priority.toLowerCase()]++;

            if(t.dueDate && new Date(t.dueDate) < nowDate && t.status !== 'completed'){
                stats.overDue++;
                taskByMember[memberId].stats.overDue++;
            }
        }
        
        return res.status(200).json({success: true, message: "Team tasks retrieved successfully", kanbanBoard, stats, allTasks: activeTasks, deletedTasks, taskByMember});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching tasks' });
    }
}

// Used in Dashboard for filtering tasks of user across teams, and displays all tasks of the user in different columns based on their status
const getMyTasksInTeam= async (req, res) => {
    try{
        const userId= req.userId;

        const {teamId}= req.params;

        const team = await Team.findById(teamId).select('leader members').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isMember= team.leader.toString() === userId.toString() || team.members.some(m => m.user.toString() === userId.toString());

        if(!isMember){
            return res.status(403).json({success: false, message: 'Only team members can view tasks' });
        }

        const tasks= await Task.find({team: teamId, assignedTo: userId})
        .populate('assignedBy', 'username firstName lastName profilePicture email')
        .populate('deletedBy', 'username firstName lastName profilePicture email')
        .sort({createdAt: -1})
        .lean();

        
        const nowDate= new Date();

        const kanbanBoard= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
        }

        const stats= {
            total: 0,
            byStatus: {
                todo: 0,
                'in-progress': 0,
                'in-review': 0,
                completed: 0,
            },
            byPriority: {
                high: 0,
                medium: 0,
                low: 0,
            },
            overDue: 0,
        }

        const activeTasks= [];
        const deletedTasks= [];

        for(const t of tasks){
            if(t.isDeleted){
                kanbanBoard.deleted.push(t);
                deletedTasks.push(t);
                continue;
            }
            activeTasks.push(t);
            
            if (kanbanBoard[t.status]) {
                kanbanBoard[t.status].push(t);
                stats.byStatus[t.status]++;
            }
            
            stats.total++;
            stats.byPriority[t.priority.toLowerCase()]++;

            if(t.dueDate && new Date(t.dueDate) < nowDate && t.status !== 'completed'){
                stats.overDue++;
            }
        }

        return res.status(200).json({success: true, message: "My tasks in team retrieved successfully", kanbanBoard, stats, allTasks: activeTasks, deletedTasks});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching tasks' });
    }
}

// Get my tasks across all Teams
const getMyTasks= async (req, res)=> {
    try{
        const userId= req.userId;

        const tasks= await Task.find({assignedTo: userId})
        .populate('assignedBy', 'username firstName lastName profilePicture email')
        .populate('deletedBy', 'username firstName lastName profilePicture email')
        .sort({createdAt: -1})
        .lean();

        const nowDate= new Date();

        const kanbanBoard= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
        }

        const stats= {
            total: 0,
            byStatus: {
                todo: 0,
                'in-progress': 0,
                'in-review': 0,
                completed: 0,
            },
            byPriority: {
                high: 0,
                medium: 0,
                low: 0,
            },
            overDue: 0,
        }

        const activeTasks= [];
        const deletedTasks= [];

        for(const t of tasks){
            if(t.isDeleted){
                kanbanBoard.deleted.push(t);
                deletedTasks.push(t);
                continue;
            }
            activeTasks.push(t);

            if (kanbanBoard[t.status]) {
                kanbanBoard[t.status].push(t);
                stats.byStatus[t.status]++;
            }

            
            stats.total++;
            stats.byPriority[t.priority.toLowerCase()]++;

            if(t.dueDate && new Date(t.dueDate) < nowDate && t.status !== 'completed'){
                stats.overDue++;
            }
        }

        return res.status(200).json({success: true, message: "My tasks retrieved successfully", kanbanBoard, stats, allTasks: activeTasks, deletedTasks});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching tasks' });
    }
}

// used in the Team.details.jsx file for updating status of task when dragged and dropped in different columns in kanban board, and also used for marking task as completed from task details view
const updateTaskStatus = async (req, res) => {
    try{
        const userId= req.userId;

        const {taskId}= req.params;
        const {status}= req.body;

        if(!['todo', 'in-progress', 'in-review', 'completed'].includes(status)){
            return res.status(400).json({success: false, message: 'Invalid status value' });
        }

        const task= await Task.findById(taskId).populate('team', 'leader members name')
        .populate('assignedTo', 'username firstName lastName profilePicture email')
        .populate('assignedBy', 'username firstName lastName profilePicture email')
        
        if(!task){
            return res.status(404).json({success: false, message: 'Task not found' });
        }

        if(task.isDeleted){
            return res.status(400).json({success: false, message: "Deleted tasks cannot be updated"});
        }

        const team= task.team;
        const isAssigned= task.assignedTo._id.toString() === userId.toString();
        const isLeader=  team.leader.toString() === userId.toString();
        const isAdmin= team.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');

        if(!isAssigned && !isAdmin && !isLeader){
            return res.status(403).json({success: false, message: 'Only assigned user, team leader or admins can update task status' });
        }

        if (task.status === status) {
            return res.status(200).json({
                success: true,
                message: 'Task already in this status',
                task
            });
        }

        task.status= status;

        task.updatedAt= new Date();
        if(status === 'completed'){
            task.completedAt= new Date();
        }

        await task.save();

        return res.status(200).json({success: true, message: "Task status updated successfully", task});

    }catch(error){
        console.error("Error updating task status:", error);
        return res.status(500).json({success: false, message: "Server error while updating task status"});
    }
}

// used in TaskDetails.jsx for updating task details like title, description, priority, due date, and assigned user
const updateTask= async (req, res) => {
    try{
        const userId= req.userId;

        const {taskId}= req.params;

        const {title, description, priority, dueDate, assignedTo }= req.body;

        const trimmedTitle= title ? title.trim() : undefined;
        const trimmedDescription= description ? description.trim() : undefined;

        if (trimmedTitle && (trimmedTitle.length < 3 || trimmedTitle.length > 50)) {
            return res.status(400).json({
                success: false,
                message: 'Title must be between 3 and 50 characters'
            });
        }

        const task = await Task.findById(taskId).populate('team', 'leader members name');

        if(!task){
            return res.status(404).json({success: false, message: 'Task not found' });
        }

        if(task.isDeleted){
            return res.status(400).json({success: false, message: "Deleted tasks cannot be updated"});
        }

        const team = task.team;
        const isLeader=  team.leader.toString() === userId.toString();
        const isAdmin= team.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');

        if(!isAdmin && !isLeader){
            return res.status(403).json({success: false, message: 'Only team leader or admins can update task' });
        }

        let updated= false;

        if(trimmedTitle !== undefined){
             task.title= trimmedTitle;
             updated = true;
        }
        if(trimmedDescription !== undefined) {
            task.description= trimmedDescription;
            updated= true;
        }
        if(priority !== undefined) {
            if(!['Low', 'Medium', 'High'].includes(priority)){
                return res.status(400).json({success: false, message: "Invalid priority value"});
            }
            task.priority= priority;
            updated= true;

        }
        if (dueDate !== undefined) {
            task.dueDate = dueDate ? new Date(dueDate) : null;
            updated = true;
        }

        if(assignedTo !== undefined){
            const isMember= team.members.some(m => m.user.toString() === assignedTo.toString()) || team.leader.toString() === assignedTo.toString();
            const isAssignedLeader= team.leader.toString() === assignedTo.toString();

            if(!isMember){
                return res.status(400).json({success: false, message: 'Assigned user must be a member of the team or not a Team Leader' });
            }
            if(isAdmin && isAssignedLeader){
                return res.status(400).json({success: false, message: 'Admins cannot assign tasks to the team leader' });
            }
            task.assignedTo= assignedTo;
            updated = true;
        }

        if(!updated){
            return res.status(200).json({success: true, message: 'No changes made to the task', task});
        }

        task.updatedBy= userId;
        task.updatedAt= new Date();

        await task.save();

        await task.populate('assignedTo', 'firstName lastName username profilePicture email').populate('assignedBy', 'firstName lastName username profilePicture').populate('updatedBy', 'firstName lastName username profilePicture');

        try{
            const emailTemplate= updateTaskTemplate({
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                assignedBy: task.assignedBy.firstName + ' ' + task.assignedBy.lastName,
            })

            const mailOptions= {
                from: `"Support" <${process.env.SENDER_EMAIL}>`,
                to: task.assignedTo.email,
                subject: emailTemplate.subject,
                text: emailTemplate.html.replace(/<[^>]+>/g, ''),
            }

            await transporter.sendMail(mailOptions);
        }catch(error){
            console.log('Error sending task update email:', error.message);
        }

        return res.status(200).json({success: true, message: "Task updated successfully", task});

    }catch(error){
        console.error("Error updating task:", error);
        return res.status(500).json({success: false, message: "Server error while updating task"});
    }
}

// used in TaskDetails.jsx for restoring a deleted task, and also used for permanently deleting a task from task details view
const restoreTask= async (req, res) => {
    try{
        const userId= req.userId;

        const {taskId}= req.params;

        const task= await Task.findById(taskId).populate('team', 'leader members name');

        if(!task){
            return res.status(404).json({success: false, message: 'Task not found' });
        }

        const team= task.team;
        
        const isLeader= team.leader.toString() === userId.toString();
        const isAdmin= team.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');

        if(!isAdmin && !isLeader){
            return res.status(403).json({success: false, message: 'Only team leader or admins can restore task' });
        }
        
        if(!task.isDeleted){
            return res.status(400).json({success: false, message: 'Task is not deleted' });
        }

        task.isDeleted= false;
        task.deletedAt= null;
        task.deletedBy= null;
        task.updatedBy= userId;
        task.updatedAt= new Date();
        task.status= 'todo';
        await task.save();

        await task.populate('assignedTo', 'firstName lastName username profilePicture').populate('assignedBy', 'firstName lastName username profilePicture');

        return res.status(200).json({success: true, message: "Task restored to To-Do", task});

    }catch (error) {
        console.error("Error restoring task:", error);
        return res.status(500).json({success: false, message: "Server error while restoring task"});
    }
}

// used in TaskDetails.jsx for restoring a deleted task, and also used for permanently deleting a task from task details view
const deleteTask= async (req, res) => {
    try{
        const userId= req.userId;
        
        const {taskId}= req.params;

        const task= await Task.findById(taskId).populate('team', 'leader members name');

        if(!task){
            return res.status(404).json({success: false, message: 'Task not found' });
        }

        const team= task.team;
        
        const isLeader= team.leader.toString() === userId.toString();
        const isAdmin= team.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');
        
        if(!isAdmin && !isLeader){
            return res.status(403).json({success: false, message: 'Only team leader or admins can delete task' });
        }

        if(task.isDeleted){
            return res.status(400).json({success: false, message: 'Task is already deleted' });
        }

        task.isDeleted= true;
        task.deletedAt= new Date();
        task.deletedBy= userId;
        task.updatedBy= userId;
        task.updatedAt= new Date();
        await task.save();
        
        const recipients = new Set([
            team.leader.toString(),
            ...team.members.map((member) => member.user.toString()),
        ]);

        const removalNotifications = Array.from(recipients)
            .filter((recipientId) => recipientId !== userId)
            .map((recipientId) => ({
                recipient: recipientId,
                actor: userId,
                type: 'task-removed',
                title: 'Task removed',
                message: `A task was removed: ${task.title}`,
                metadata: { taskId: task._id, teamId: team._id, teamName: team.name },
            }));

        await createNotifications(removalNotifications);

        return res.status(200).json({success: true, message: "Task deleted successfully", task});

    }catch(error){
        console.error("Error deleting task:", error);
        return res.status(500).json({success: false, message: "Server error while deleting task"});
    }
}

const getWorkspaceTaskBoard= async (req, res) => {
    try{
        const userId= req.userId;

        const teams= await Team.find({
            $or:[
                {leader: userId},
                {'members.user' : userId}
            ]
        }).select('_id name leader members').lean();

        const teamIds= teams.map(t => t._id);
        
        const assignedToMe= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
            stats: {
                byStatus: {
                    todo: 0,
                    'in-progress': 0,
                    'in-review': 0,
                    completed: 0,
                    deleted: 0,
                }
            }
        }
        const assignedByMeAsLeader= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
            stats: {
                byStatus: {
                    todo: 0,
                    'in-progress': 0,
                    'in-review': 0,
                    completed: 0,
                    deleted: 0,
                }
            }
        }
        const assignedByMeAsAdmin= {
            todo: [],
            'in-progress': [],
            'in-review': [],
            completed: [],
            deleted: [],
            stats: {
                byStatus: {
                    todo: 0,
                    'in-progress': 0,
                    'in-review': 0,
                    completed: 0,
                    deleted: 0,
                }
            }
        }

        if(teamIds.length === 0){
            return res.status(200).json({success: true, message: 'No teams found', assignedToMe, assignedByMeAsLeader, assignedByMeAsAdmin});
        }

        const tasks= await Task.find({team: {$in: teamIds}})
        .populate('team', 'name leader members')
        .populate('assignedTo', 'username firstName lastName profilePicture email')
        .populate('assignedBy', 'username firstName lastName profilePicture email')
        .sort({createdAt: -1})
        .lean();

        for(const t of tasks){
            const isAssignedToMe= t.assignedTo._id.toString() === userId.toString();

            if(isAssignedToMe){
                if(t.isDeleted){
                    assignedToMe.deleted.push(t);
                    assignedToMe.stats.byStatus.deleted++;
                    continue;
                }
                if (assignedToMe[t.status]) {
                    assignedToMe[t.status].push(t);
                    assignedToMe.stats.byStatus[t.status]++;
                }
            }

            const isAssignedByMe= t.assignedBy._id.toString() === userId.toString();

            const isTeamLeader = t.team.leader.toString() === userId.toString();

            if(isAssignedByMe && isTeamLeader){
                if(t.isDeleted){
                    assignedByMeAsLeader.deleted.push(t);
                    assignedByMeAsLeader.stats.byStatus.deleted++;
                    continue;
                }
                assignedByMeAsLeader[t.status].push(t);
                assignedByMeAsLeader.stats.byStatus[t.status] ++;
            }

            const member = t.team.members.find(
                m => m.user.toString() === userId.toString()
            );
            const isTeamAdmin = member?.role === 'admin';

            if(isAssignedByMe && !isTeamLeader && isTeamAdmin ){
                if(t.isDeleted){
                    assignedByMeAsAdmin.deleted.push(t);
                    assignedByMeAsAdmin.stats.byStatus.deleted++;
                    continue;
                }
                assignedByMeAsAdmin[t.status].push(t);
                assignedByMeAsAdmin.stats.byStatus[t.status] ++;
            }
        }

        
        return res.status(200).json({success: true, message: 'Workspace task board retrieved successfully',
            assignedToMe,
            assignedByMeAsLeader,
            assignedByMeAsAdmin,
        });

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching workspace task board' });
    }
}

const getTeamMemberProgress = async (req, res) => {
    try {
        const userId = req.userId;
        const userIdStr = userId.toString();
        const { teamId } = req.params;

        const team = await Team.findById(teamId)
            .populate('leader', 'firstName lastName username profilePicture')
            .populate('members.user', 'firstName lastName username profilePicture')
            .lean();

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const isMember =
            team.leader._id.toString() === userIdStr ||
            team.members.some(m => m.user._id.toString() === userIdStr);

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'Only team members can view progress'
            });
        }

        const tasks = await Task.find({ team: teamId })
            .select('assignedTo status dueDate completedAt createdAt priority')
            .lean();

        const now = new Date();

        const userMap = new Map();

        const allUsers = [
            { user: team.leader, role: 'leader', joinedAt: team.createdAt },
            ...team.members.map(m => ({
                user: m.user,
                role: m.role,
                joinedAt: m.joinedAt
            }))
        ];

        for (const entry of allUsers) {
            const uid = entry.user._id.toString();

            if (userMap.has(uid)) continue;

            userMap.set(uid, {
                user: entry.user,
                role: entry.role,
                stats: {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                    inReview: 0,
                    todo: 0,
                    deleted: 0,
                    overdue: 0,
                    onTime: 0,
                    totalResolutionMs: 0
                },
                byPriority: {
                    High: 0,
                    Medium: 0,
                    Low: 0
                }
            });
        }

        for (const t of tasks) {
            if (!t.assignedTo) continue;

            const uid = t.assignedTo.toString();
            const entry = userMap.get(uid);
            if (!entry) continue;

            const stats = entry.stats;

            stats.total++;

            if (t.isDeleted) {
                stats.deleted++;
                continue;
            }

            // Status counts
            switch (t.status) {
                case 'completed':
                    stats.completed++;
                    break;
                case 'in-progress':
                    stats.inProgress++;
                    break;
                case 'in-review':
                    stats.inReview++;
                    break;
                case 'todo':
                    stats.todo++;
                    break;
            }

            // Overdue
            if (
                t.dueDate &&
                new Date(t.dueDate) < now &&
                t.status !== 'completed' &&
                !t.isDeleted
            ) {
                stats.overdue++;
            }

            // Completed logic
            if (t.status === 'completed' && t.completedAt) {
                const start = new Date(t.createdAt);
                const end = new Date(t.completedAt);

                if (t.dueDate && new Date(t.dueDate) >= end) {
                    stats.onTime++;
                }

                stats.totalResolutionMs += (end - start);
            }

            // Priority
            if (t.priority && entry.byPriority[t.priority] !== undefined) {
                entry.byPriority[t.priority]++;
            }
        }

        const memberProgress = [];

        for (const entry of userMap.values()) {
            const s = entry.stats;

            const active = s.total - s.deleted;

            const completionRate =
                active > 0 ? Math.round((s.completed / active) * 100) : 0;

            const onTimeRate =
                s.completed > 0 ? Math.round((s.onTime / s.completed) * 100) : 0;

            let avgResolutionDays = 0;
            if (s.completed > 0) {
                avgResolutionDays =
                    Math.round(
                        (s.totalResolutionMs / s.completed) /
                            (1000 * 60 * 60 * 24) *
                            10
                    ) / 10;
            }

            memberProgress.push({
                user: {
                    _id: entry.user._id,
                    firstName: entry.user.firstName,
                    lastName: entry.user.lastName,
                    username: entry.user.username,
                    profilePicture: entry.user.profilePicture
                },
                role: entry.role,
                stats: {
                    total: s.total,
                    completed: s.completed,
                    inProgress: s.inProgress,
                    inReview: s.inReview,
                    todo: s.todo,
                    deleted: s.deleted,
                    overdue: s.overdue,
                    completionRate,
                    onTimeRate,
                    avgResolutionDays
                },
                byPriority: entry.byPriority
            });
        }

        memberProgress.sort(
            (a, b) =>
                b.stats.completionRate - a.stats.completionRate ||
                b.stats.total - a.stats.total
        );

        let totalCompleted = 0;
        let totalOverdue = 0;

        for (const t of tasks) {
            if (t.isDeleted) continue;

            if (t.status === 'completed') totalCompleted++;

            if (
                t.dueDate &&
                new Date(t.dueDate) < now &&
                t.status !== 'completed' &&
                !t.isDeleted
            ) {
                totalOverdue++;
            }
        }

        const totalTasks = tasks.length;
        const totalActive = tasks.filter(t => !t.isDeleted).length;

        const teamCompletionRate =
            totalActive > 0
                ? Math.round((totalCompleted / totalActive) * 100)
                : 0;

        return res.status(200).json({
            success: true,
            message: 'Progress report retrieved successfully',
            teamSummary: {
                totalTasks,
                completed: totalCompleted,
                overdue: totalOverdue,
                completionRate: teamCompletionRate,
                membersCount: userMap.size
            },
            memberProgress
        });

    } catch (error) {
        console.error('Error retrieving team member progress:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while retrieving team member progress'
        });
    }
};


module.exports= {createTask, getTeamTasks, getMyTasksInTeam, getMyTasks, updateTaskStatus, updateTask, deleteTask, restoreTask, getWorkspaceTaskBoard, getTeamMemberProgress};