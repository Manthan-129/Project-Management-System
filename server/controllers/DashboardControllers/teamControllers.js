const Team= require('../../models/Team')
const User= require('../../models/User')
const Task= require('../../models/Task')
const TeamInvitation= require('../../models/TeamInvitation')
const { transporter } = require('../../configs/nodemailer')
const { createNotification } = require('../../utils/notificationService.js')
const { teamInvitationTemplate }= require('../../utils/emailTemplates')


const mongoose= require('mongoose');

// Create a new team
const createTeam= async (req, res) => {
    try{
        const userId= req.userId;
        const {name, title, description}= req.body;
        
        const trimmedName= name.trim();
        const trimmedTitle= title.trim();
        const trimmedDescription= description ? description.trim() : '';

        if(!trimmedName || !trimmedTitle){
            return res.status(400).json({success: false, message: 'Name and title are required' });
        }

        if(trimmedName.length < 3 || trimmedName.length > 50){
            return res.status(400).json({success: false, message: 'Team name must be between 3 and 50 characters' });
        }

        if(trimmedTitle.length < 3 || trimmedTitle.length > 100){
            return res.status(400).json({success: false, message: 'Team title must be between 3 and 100 characters' });
        }

        const team= await Team.create({
            name: trimmedName,
            title: trimmedTitle,
            description: trimmedDescription,
            leader: userId,
            members: [{user: userId, role: 'admin'}],
        })

        return res.status(201).json({success: true,  message: 'Team created successfully', team });

    }catch(error){
        console.log(error.message);
        if(error.code === 11000){
            return res.status(400).json({success: false, message: 'Team name already exists. Please choose a different name.' });
        }
        return res.status(500).json({success: false, message: 'Error while creating team'})
    }
}

// Get all the teams in which user is leader or joined as member/admin
const getMyTeams= async (req, res) => {
    try{
        const userId= req.userId;

        const teams= await Team.find({
            $or:[
                {leader: userId},
                {'members.user': userId}
            ]
        }).
        select('name title leader members memberCount createdAt').
        populate('leader', 'username firstName lastName email profilePicture').
        populate('members.user', 'username firstName lastName email profilePicture').
        sort({createdAt: -1}).
        lean();

        return res.status(200).json({success: true, teams});
        
    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching teams'})
    }
}

// Get Team Details (only for members)
const getTeamDetails= async (req, res) => {
    try{
        const userId= req.userId;
        const {teamId}= req.params;
        
        if(!mongoose.Types.ObjectId.isValid(teamId)){
            return res.status(400).json({success: false, message: 'Invalid Team ID' });
        }

        const team= await Team.findOne({
            _id: teamId,
            $or: [
                {leader: userId},
                {'members.user': userId}
            ]
        }).
        select('name title description leader createdAt').
        populate('leader', 'username firstName lastName profilePicture').
        lean();
        
        if(!team){
            return res.status(404).json({success: false, message: 'Access Denied or Team not found' });
        }

        return res.status(200).json({success: true, team});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching team details'})
    }
}

// Send Team Invitation
const sendTeamInvitation= async (req, res) => {
    try{

        const userId= req.userId;
        const {teamId}= req.params;
        
        if(!mongoose.Types.ObjectId.isValid(teamId)){
            return res.status(400).json({success: false, message: 'Invalid Team ID' });
        }

        const {username, message}= req.body;

        const trimmedUsername= username.trim();
        const trimmedMessage= message ? message.trim() : '';

        if(!trimmedUsername){
            return res.status(400).json({success: false, message: 'Username is required' });
        }
        
        const team= await Team.findOne({
            _id: teamId,
            $or: [
                {leader: userId},
                {
                    members: {
                        $elemMatch: { user: userId, role: 'admin' }
                    }
                }   
            ]
        })

        if(!team){
            return res.status(404).json({success: false, message: 'Access Denied or Team not found, Only Admin and Leader can send invitations' });
        }

        const receiver= await User.findOne({username: trimmedUsername}).
        select('_id email');

        if(!receiver){
            return res.status(404).json({success: false, message: "Receiver not found"});
        }

        const receiverAlreadyAdded= team.members.some(m => m.user.toString() === receiver._id.toString()) || team.leader.toString() === receiver._id.toString(); 

        if(receiverAlreadyAdded){
            return res.status(404).json({success: false, message: "User is already a member of the team"})
        }
        
        const sender= await User.findById(userId).select('_id firstName lastName username');;

        const isFriend = await User.exists({
            _id: userId,
            friends: receiver._id
        });

        if(!isFriend){
            return res.status(404).json({success: false, message: "Sender and Receiver are not mutual friends. You have to be friends before sending him the team invitations."});
        }

        const existingInvitation= await TeamInvitation.findOne({team: teamId, receiver: receiver._id, status: 'pending'});

        if(existingInvitation){
            return res.status(404).json({success: false, message: "An invitation has already been sent to this user"})
        }

        const invitation= await TeamInvitation.create({
            team: teamId,
            receiver: receiver._id,
            sender: sender._id,
            status: 'pending',
            message: trimmedMessage || '',
        })

        await invitation.populate('team', 'name title description').
        populate('sender', 'firstName lastName username profilePicture');
        
        await createNotification({
            recipient: receiver._id,
            actor: userId,
            type: 'team-invitation',
            title: 'Team invitation received',
            message: `${sender.firstName} ${sender.lastName} invited you to join ${team.name}`,
            metadata: { teamId: team._id, teamName: team.name, invitationId: invitation._id },
        });

        const teamInvitationData= teamInvitationTemplate({
            senderName: sender.firstName + ' ' + sender.lastName,
            senderUsername: sender.username,
            teamName: team.name,
            teamDescription: team.description,
            members: team.members.map(m => m.user),
            customMessage: trimmedMessage
        });

        const mailOptions= {
            from: `"Support" <${process.env.SENDER_EMAIL}>`,
            to: receiver.email,
            subject:teamInvitationData.subject,
            text: teamInvitationData.html.replace(/<[^>]+>/g, ''),
        }

        await transporter.sendMail(mailOptions);

        return res.status(201).json({success: true, message: "Team invitation sent successfully", invitation});
        
    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while sending team invitation'})
    }
}


// Functions made for getSentInvitations to group invitations by team in frontend easily without making multiple API calls. Frontend can send the data in below format and we will filter and group the invitations accordingly.

const groupByTeam= (invitations) => {
    return Object.values(
        invitations.reduce((acc, invitation) => {
            const teamId = invitation?.team?._id;
            
            if(!acc[teamId]){
                acc[teamId] = {
                    team: invitation.team,
                    invitations: [],
                };
            }

            acc[teamId].invitations.push(invitation);
            return acc;
        }, {})
    )
}


const getReceivedTeamInvitations= async (req, res) => {
    try{
        const userId= req.userId;

        const receivedInvitations= await TeamInvitation.find({receiver: userId, status: 'pending'}).select('team sender status createdAt').
        populate('team', 'name title description').
        populate('sender', 'firstName lastName username profilePicture').
        sort({createdAt: -1}).
        lean();

        return res.status(200).json({success: true, receivedInvitations});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching team invitations'})
    }
}

const getSentInvitationsByMe= async (req, res) => {

    try{
        const userId= req.userId;

        const team= await Team.find({
            $or: [
                {leader: userId},
                {members: {$elemMatch: {user: userId, role: 'admin'}}}
            ]
        }).select('_id').lean();

        const teamIds= team.map(t => t._id);

        if (teamIds.length === 0) {
            return res.status(200).json({
                success: true,
                groupedSentInvitations: []
            });
        }

        const sentInvitationsByMe= await TeamInvitation.find({team: {$in: teamIds}, sender: userId , status: 'pending'}).select('team receiver status createdAt').populate('team', 'name title description').populate('receiver', 'username firstName lastName profilePicture').sort({createdAt: -1}).lean();

        const groupedSentInvitations= groupByTeam(sentInvitationsByMe);

        return res.status(200).json({success: true, groupedSentInvitations});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching sent team invitations By Me.'})
    }
}

const getSentInvitationsByTeam= async (req, res) => {
    try{
        const userId= req.userId;

        const team= await Team.find({
            $or: [
                {leader: userId},
                {members: {$elemMatch: {user: userId, role: 'admin'}}}
            ]
        }).select('_id').lean();

        const teamIds= team.map(t => t._id);

        if (teamIds.length === 0) {
            return res.status(200).json({
                success: true,
                groupedSentInvitations: []
            });
        }

        const sentInvitationsByTeam= await TeamInvitation.find({team: {$in: teamIds}, status: 'pending'}).select('team sender receiver status createdAt').populate('team', 'name title description').populate('sender', 'username firstName lastName profilePicture').populate('receiver', 'username firstName lastName profilePicture').sort({createdAt: -1}).lean();

        const groupedSentInvitations= groupByTeam(sentInvitationsByTeam);

        return res.status(200).json({success: true, groupedSentInvitations});
        
    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching sent team invitations By Team.'})
    }
}

const respondToTeamInvitation= async (req, res) => {
    try{
        const userId= req.userId;
        const {invitationId}= req.params;
        const {status}= req.body;

        if(!['accepted', 'rejected'].includes(status)){
            return res.status(400).json({success: false, message: 'Invalid status value' });
        }

        const invitation= await TeamInvitation.findOne({
            _id: invitationId,
            receiver: userId,
            status: 'pending',
        })
        
        if(!invitation){
            return res.status(404).json({success: false, message: 'Invitation not found or already responded' });
        }
        
        const senderId= invitation.sender;

        const areFriends= await User.exists({
            _id: userId,
            friends: senderId
        })

        if(!areFriends){
            invitation.status= 'rejected';
            await invitation.save();

            return res.status(400).json({success: false, message: "Sender and Receiver are not mutual friends. You have to be friends before responding to team invitations."});
        }

        invitation.status= status;
        await invitation.save();

        if(status === 'accepted'){
            await Team.updateOne(
                {
                    _id: invitation.team,
                    "members.user" : {$ne : userId}
                },
                {
                    $push: {members: {user: userId, role: 'member'}},
                    $inc: {memberCount: 1}
                }
            )
        }

        return res.status(200).json({success: true, message: `Team invitation ${status} successfully`, invitation});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while responding to team invitation'})
    }
}

const makeUserAdminOrMember= async (req, res) => {
    try{
        const userId= req.userId;

        const userIdStr= userId.toString();

        const {teamId, memberId}= req.params;

        const memberIdStr= memberId.toString();

        const {role}= req.body;

        if(!['admin', 'member'].includes(role)){
            return res.status(400).json({success: false, message: 'Invalid role value' });
        }

        const team= await Team.findById(teamId).select('leader members').lean();
        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isMember= team.members.find(m => m.user.toString() === memberIdStr);
        const isReceiverLeader= team.leader.toString() === memberIdStr;

        const isSenderLeader= team.leader.toString() === userIdStr;

        if(!isMember && !isReceiverLeader){
            return res.status(404).json({success: false, message: 'User is not a member of the team' });
        }
        
        if(isReceiverLeader){
            return res.status(400).json({success: false, message: 'Team leader role cannot be changed' });
        }
        if(!isSenderLeader){
            return res.status(403).json({success: false, message: 'Only team leader can change roles' });
        }

        const memberRole= isMember.role;

        if(memberRole === role){
            return res.status(200).json({success: true, message: `User is already a ${role}` });
        }

        await Team.updateOne(
            {_id: teamId, leader: userId, 'members.user': memberId},
            {$set: {'members.$.role': role, 'members.$.updatedAt': new Date()}}
        )

        return res.status(200).json({success: true, message: `User role updated to ${role} successfully`});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while updating user role'})
    }
}

const allMemberOfTeam= async (req, res) => {
    try{
        const userId= req.userId;

        const {teamId}= req.params;
        
        const userIdStr= userId.toString();

        const team= await Team.findById(teamId).select('leader members')
        .populate('leader', 'username firstName lastName profilePicture privacySettings')
        .populate('members.user', 'firstName lastName username profilePicture privacySettings')
        .lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const member= team.members.find(m => m.user._id.toString() === userIdStr) || team.leader._id.toString() === userIdStr;

        if(!member){
            return res.status(403).json({success: false, message: 'Access denied' });
        }

        return res.status(200).json({success: true, members: team.members, leader: team.leader});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while fetching team members'})
    }
}

const removeTeamMember= async (req, res) => {
    try{
        const userId= req.userId;
        const {teamId, memberId}= req.params;

        const userIdStr= userId.toString();
        const memberIdStr= memberId.toString();

        if(userIdStr === memberIdStr){
            return res.status(400).json({success: false, message: 'Use leave team API to leave the team by yourself' });
        }

        const team= await Team.findById(teamId).select('leader members').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isReceiverLeader= team.leader.toString() === memberIdStr;
        const isSenderLeader= team.leader.toString() === userIdStr;

        const isReceiverAdmin= team.members.some(m => m.user.toString() === memberIdStr && m.role === 'admin');
        const isSenderAdmin= team.members.some(m => m.user.toString() === userIdStr && m.role === 'admin');

        const isReceiverMember= team.members.find(m => m.user.toString() === memberIdStr);
        
        if(!isSenderLeader && !isSenderAdmin){
            return res.status(403).json({success: false, message: 'Only team leader and admins can remove members' });
        }

        if(!isReceiverMember){
            return res.status(403).json({success: false, message: 'User is not a member of the team' });
        }

        if(isReceiverLeader){
            return res.status(400).json({success: false, message: 'Team leader cannot be removed from the team' });
        }

        if(isSenderAdmin && isReceiverAdmin){
            return res.status(403).json({success: false, message: 'Admin cannot remove another admin. Only team leader can remove admins' });
        }

        const result= await Team.updateOne(
        {
            _id: teamId,
            "members.user": memberId
        },
        {
            $pull: { members: { user: memberId } },
            $inc: { memberCount: -1 }
        }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to remove member'
            });
        }
        return res.status(200).json({success: true, message: 'Member removed from the team successfully'});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while removing team member'})
    }
}

const leaveTeam= async (req, res) => {
    try{
        const userId= req.userId;
        const {teamId}= req.params;

        const userIdStr= userId.toString();
        const team= await Team.findById(teamId).select('leader members').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isLeader= team.leader.toString() === userIdStr;
        if(isLeader){
            return res.status(400).json({success: false, message: 'Team leader cannot leave the team. You can either delete the team or transfer the leadership to another member before leaving the team.' });
        }

        const isMember= team.members.some(m => m.user.toString() === userIdStr);

        if(!isMember){
            return res.status(403).json({success: false, message: 'You are not a member of the team' });
        }

        const result= await Team.updateOne(
            {_id: teamId, 'members.user': userId},
            {$pull : {members: {user: userId}}, $inc: {memberCount: -1}}
        );

        if(result.modifiedCount === 0){
            return res.status(400).json({success: false, message: 'Failed to leave the team'});
        }

        return res.status(200).json({success: true, message: 'Left the team successfully'});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while leaving the team'})
    }
}

const deleteTeam= async (req, res) => {
    try{
        const userId= req.userId;
        const userIdStr= userId.toString();

        const {teamId}= req.params;

        const team= await Team.findById(teamId).select('leader').lean();

        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isLeader= team.leader.toString() === userIdStr;

        if(!isLeader){
            return res.status(403).json({success: false, message: 'Only team leader can delete the team' });
        }

        const result1= await Team.deleteOne({_id: teamId});

        if(result1.deletedCount === 0){
            return res.status(400).json({success: false, message: 'Failed to delete the team'});
        }

        await TeamInvitation.deleteMany({team: teamId});
        await Task.deleteMany({team: teamId});

        return res.status(200).json({success: true, message: 'Team deleted successfully'});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while deleting the team'})
    }
}


const transferLeadership= async (req, res) => {
    try{
        const userId= req.userId;
        const userIdStr= userId.toString();

        const {teamId, newLeaderId}= req.params;

        const newLeaderIdStr= newLeaderId.toString();

        if(userIdStr === newLeaderIdStr){
            return res.status(400).json({success: false, message: 'You are already the team leader' });
        }

        const team= await Team.findById(teamId).select('leader members').lean();
        if(!team){
            return res.status(404).json({success: false, message: 'Team not found' });
        }

        const isSenderLeader= team.leader.toString() === userIdStr;
        if(!isSenderLeader){
            return res.status(403).json({success: false, message: 'Only team leader can transfer the leadership' });
        }

        const isNewLeaderAlreadyLeader= team.leader.toString() === newLeaderIdStr;
        if(isNewLeaderAlreadyLeader){
            return res.status(400).json({success: false, message: 'User is already the team leader' });
        }

        const isNewLeaderMember= team.members.find(m => m.user.toString() === newLeaderIdStr);

        if(!isNewLeaderMember){
            return res.status(404).json({success: false, message: 'New leader must be a member of the team' });
        }

        const result= await Team.updateOne(
            {_id: teamId, leader: userId},
            {
                $set: {
                    leader: newLeaderId,
                    'members.$[newLeader].role': 'admin',
                    'members.$[currentLeader].role': 'admin'
                },
            },
            {
                arrayFilters : [
                    { 'newLeader.user': new mongoose.Types.ObjectId(newLeaderId) },
                    { 'currentLeader.user': new mongoose.Types.ObjectId(userId) }
                ]
            }
        )

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Leadership transfer failed'
            });
        }

        return res.status(200).json({success: true, message: 'Team leadership transferred successfully'});

    }catch(error){
        console.log(error.message);
        return res.status(500).json({success: false, message: 'Error while transferring leadership'})
    }
}

module.exports= {createTeam, getMyTeams, getTeamDetails, sendTeamInvitation, getReceivedTeamInvitations, getSentInvitationsByMe, getSentInvitationsByTeam, respondToTeamInvitation, makeUserAdminOrMember, allMemberOfTeam, removeTeamMember, leaveTeam, deleteTeam, transferLeadership}