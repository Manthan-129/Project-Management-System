const Team= require('../../models/Team');
const Task= require('../../models/Task');
const User= require('../../models/User');
const PullRequest= require('../../models/PullRequest');
const { transporter } = require('../../configs/nodemailer');
const { pullRequestTemplate, pullRequestReviewTemplate } = require('../../utils/emailTemplates');

const createPullRequest= async (req, res) => {
    try{
        const userId= req.userId;
        const {taskId}= req.params;
        const {githubPRLink, message}= req.body;
        
        const trimmedLink= githubPRLink?.trim();
        const trimmedMessage= message?.trim();

        if(!trimmedLink) return res.status(400).json({success: false, message: 'GitHub PR link is required'});

        const task= await Task.findById(taskId).populate('assignedTo', '_id firstName lastName profilePicture username').populate('assignedBy', '_id firstName lastName profilePicture username');

        if(!task) return res.status(404).json({success: false, message: 'Task not found'});

        if(task.assignedTo._id.toString() !== userId){
            return res.status(403).json({success: false, message: "Only the assigned user can submit a pull request for this task"});
        }

        const existingPR= await PullRequest.findOne({task: taskId, sender: userId, status: 'pending'});

        if(existingPR) return res.status(400).json({success: false, message: 'You already have a pending pull request for this task'});



        const team= await Team.findById(task.team).populate('leader', 'firstName lastName username email').lean();
        if(!team){
            return res.status(404).json({success: false, message: "Team not found"});
        }

        const newPR= new PullRequest({
            task: taskId,
            team: task.team,
            sender: userId,
            githubPRLink: trimmedLink,
            message: trimmedMessage,
        });
        await newPR.save();

        task.status= 'in-review';
        task.updatedAt = new Date();

        await task.save();
        
        await newPR.populate([
            { path: 'sender', select: 'firstName lastName username profilePicture' },
            { path: 'task', select: 'title description status priority' },
        ]);


        const emailTemplate= pullRequestTemplate({
            taskTitle: task.title,
            senderName: task.assignedTo.firstName + ' ' + task.assignedTo.lastName,
            githubPRLink: trimmedLink,
            message: trimmedMessage || '',
        })

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: team.leader.email,
            subject: emailTemplate.subject,
            text: emailTemplate.html.replace(/<[^>]+>/g, ''),
        }

        await transporter.sendMail(mailOptions);

        res.status(201).json({success: true, message: 'Pull request submitted successfully'});

    } catch (error) {
        console.error('Error creating pull request:', error);
        res.status(500).json({success: false, message: 'Server error while creating pull request'});
    }
}

const reviewPullRequest= async (req, res) => {
    try{
        const userId= req.userId;
        const {pullRequestId}= req.params;
        const {status, reviewNote}= req.body;

        if(!['accepted', 'rejected'].includes(status)){
            return res.status(400).json({success: false, message: "Status must be either 'accepted' or 'rejected'"});
        }

        const pullRequest= await PullRequest.findById(pullRequestId).populate('sender', 'firstName lastName username email').populate('task', 'title team');

        if(!pullRequest) return res.status(404).json({success: false, message: 'Pull request not found'});

        const team= await Team.findById(pullRequest.task.team).populate('leader', '_id firstName lastName username email').lean();

        if(!team) return res.status(404).json({success: false, message: 'Team not found'});

        const isLeaderOrAdmin= team.leader._id.toString() === userId || team.members.some(m => m.user.toString() === userId && m.role === 'admin');

        if(!isLeaderOrAdmin){
            return res.status(403).json({success: false, message: "Only the team leader or admins can review pull requests"});
        }

        if(pullRequest.status !== 'pending'){
            return res.status(400).json({success: false, message: 'Only pending pull requests can be reviewed'});
        }

        await PullRequest.findByIdAndUpdate(pullRequestId, {
            status,
            reviewNote: reviewNote?.trim() || '',
            reviewedBy: userId,
            reviewedAt: new Date(),
        });

        const task= await Task.findById(pullRequest.task._id).select('leader members');

        if(task){
            if(status === 'accepted'){
                task.status= 'completed';
                task.completedAt= new Date();
            } else if(status === 'rejected'){
                task.status= 'in-progress';
            }
            task.updatedAt= new Date();
            await task.save();
        }

        await pullRequest.populate([
            { path: 'sender', select: 'firstName lastName username profilePicture' },
            { path: 'reviewedBy', select: 'firstName lastName username profilePicture' },
            { path: 'task', select: 'title description status priority' },
        ]);

        // Send email to PR sender about the review result
        const reviewerInfo= await User.findById(userId).select('firstName lastName');

        const emailTemplate= pullRequestReviewTemplate({
            taskTitle: pullRequest.task.title,
            reviewerName: reviewerInfo.firstName + ' ' + reviewerInfo.lastName,
            status,
            reviewNote: reviewNote || '',
        });

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: pullRequest.sender.email,
            subject: emailTemplate.subject,
            text: emailTemplate.html.replace(/<[^>]+>/g, ''),
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({success: true, message: 'Pull request reviewed successfully', pullRequest});

    }catch(error){
        console.log('Error reviewing pull request:', error.message);
        return res.status(500).json({success: false, message: 'Server error while reviewing pull request'});
    }
}

const getTeamPullRequests= async (req, res) => {
    try{
        const userId= req.userId;
        const {teamId}= req.params;
        const {status}= req.query;

        if(status && !['pending', 'accepted', 'rejected'].includes(status)){
            return res.status(400).json({success: false, message: "Status filter must be either 'pending', 'accepted', or 'rejected'"});
        }

        const team= await Team.findById(teamId);

        if(!team) return res.status(404).json({success: false, message: 'Team not found'});

        const isMember= team.members.some(m => m.user.toString() === userId) || team.leader.toString() === userId;

        if(!isMember){
            return res.status(403).json({success: false, message: "Only team members can view pull requests"});
        }

        const pullRequests= await PullRequest.find({team: teamId, status: status || 'pending'}).select('reviewedBy task status githubPRLink message sender createdAt')
        .populate('reviewedBy', 'firstName lastName username profilePicture')
        .populate('task', 'title description status priority dueDate')
        .populate('sender', 'firstName lastName username profilePicture')
        .sort({createdAt: -1})
        .lean();

        return res.status(200).json({success: true, pullRequests});

    }catch(error){
        console.error("Error fetching team pull requests:", error);
        return res.status(500).json({success: false, message: "Server error while fetching team pull requests"});
    }

}

const getMyPullRequests= async (req, res) => {
    try{
        const userId= req.userId;
        const {status}= req.query;
        
        if(status && !['pending', 'accepted', 'rejected', 'all-status'].includes(status)){
            return res.status(400).json({success: false, message: "Status filter must be either 'pending', 'accepted', or 'rejected'"});
        }

        const pullRequests= await PullRequest.find({sender: userId})
        .populate('sender', 'firstName lastName username profilePicture')
        .populate('reviewedBy', 'firstName lastName username profilePicture')
        .populate('task', 'title description status priority dueDate')
        .populate('team', 'name title')
        .sort({createdAt: -1})
        .lean();

        const stats= {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
        }

        for(const pr of pullRequests){
            stats.total++;
            if(pr.status === 'pending') stats.pending++;
            else if(pr.status === 'accepted') stats.accepted++;
            else if(pr.status === 'rejected') stats.rejected++;
        }

        const filteredPRs= status && status !== 'all-status' ? pullRequests.filter(pr => pr.status === status) : pullRequests;

        return res.status(200).json({success: true, pullRequests: filteredPRs, stats});

    }catch(error){
        console.error("Error fetching my pull requests:", error);
        return res.status(500).json({success: false, message: "Server error while fetching my pull requests"});
    }
}

module.exports= {createPullRequest, reviewPullRequest, getTeamPullRequests, getMyPullRequests};