const User= require('../../models/User');
const Invite= require('../../models/Invite');
const {createNotification}= require('../../utils/notificationService.js');

const sendRequestToMakeFriend= async (req, res) => {
    try{
        const userId= req.userId;
        const {username}= req.body;

        const userIdStr= userId.toString();
        const trimmedUsername= username?.trim();

        if(!trimmedUsername){
            return res.status(400).json({success: false, message: 'Username is required'});
        }

        const receiver= await User.findOne({username: trimmedUsername}).select('_id friends privacySettings');

        if(!receiver){
            return res.status(404).json({success: false, message: 'User not found'});
        }

        if(receiver.privacySettings?.showInSearch === false){
            return res.status(404).json({success: false, message: 'User not found'});
        }

        if(receiver._id.toString() === userId){
            return res.status(400).json({success: false, message: 'You cannot send a friend request to yourself'});
        }

        const friends= receiver.friends.some(f => f.toString() === userIdStr);
        if(friends){
            return res.status(400).json({success: false, message: 'You are already friends with this user'});
        }
        
        const existingInvite= await Invite.findOne({
            sender: userId,
            receiver: receiver._id,
            status: 'pending',
        }).lean();

        if(existingInvite){
            return res.status(400).json({success: false, message: 'Friend request already sent'});
        }
        

        const pendingRequestFromReceiver= await Invite.findOne({sender: receiver._id, receiver: userId, status: 'pending'});

        if(pendingRequestFromReceiver){
            pendingRequestFromReceiver.status= 'accepted';
            await pendingRequestFromReceiver.save();

            await User.updateOne(
                { _id: receiver._id },
                { $addToSet: { friends: userId } },
            );
            
            await User.updateOne(
                { _id: userId },
                { $addToSet: { friends: receiver._id } },
            );

            return res.status(200).json({success: true, message: "Friend request accepted successfully", invite: pendingRequestFromReceiver});

        }

        const recentRejection= await Invite.findOne({
            sender: userId,
            receiver: receiver._id,
            status: 'rejected',
            updatedAt: {$gte: new Date(Date.now() - 7*24*60*60*1000)}
        }).lean();

        if(recentRejection){
            return res.status(400).json({success: false, message: 'You cannot send another friend request to this user for 7 days since your last request was rejected'});
        }

        const newInvite= new Invite({
            sender: userId,
            receiver: receiver._id,
        });
        
        await newInvite.save();

        const senderUser= await User.findById(userId).select('firstName lastName username').lean();

        await createNotification({
            recipient: receiver._id,
            actor: senderUser._id,
            type: 'friend-request-received',
            title: 'Friend request received',
            message: `${senderUser?.firstName || 'Someone'} ${senderUser?.lastName || ''} sent you a friend request`.trim(),
            metadata: { inviteId: newInvite._id },
        });

        res.status(200).json({success: true, message: 'Friend request sent successfully', invite: newInvite});

    }catch(error){
        console.error('Error in sendRequestToMakeFriend:', error.message);
        res.status(500).json({success: false, message: 'Server error while sending friend request'});
    }
}

const getMyInvitationsReceived= async (req, res) => {
    try{
        const userId= req.userId;

        const requestReceive= await Invite.find({receiver: userId, status: 'pending'}).populate('sender', 'firstName lastName username email profilePicture').sort({createdAt: -1}).lean();

        return res.status(200).json({success: true,message: "Received invitations fetched successfully", invitations: requestReceive});

    }catch(error){
        console.error('Error in getMyInvitationsReceived:', error.message);
        return res.status(500).json({success: false, message: 'Server error while fetching received invitations'});
    }
}

const getMyInvitationsSent= async (req, res) => {
    try{
        const userId= req.userId;

        const requestSent= await Invite.find({sender: userId, status: 'pending'}).populate('receiver', 'firstName lastName username email profilePicture').sort({createdAt: -1}).lean();

        return res.status(200).json({success: true, message: "Sent invitations fetched successfully", invitations: requestSent});

    }catch(error){
        console.error('Error in getMyInvitationsSent:', error.message);
        return res.status(500).json({success: false, message: 'Server error while fetching sent invitations'});
    }
}

const respondToFriendRequest= async (req, res) => {
    try{
        const userId = req.userId;

        const {inviteId}= req.params;
        const {status}= req.body;

        if(!['accepted', 'rejected'].includes(status)){
            return res.status(400).json({success: false, message: 'Invalid status value'});
        }

        const invitation= await Invite.findOne({_id: inviteId, receiver: userId, status: 'pending'}).select('sender receiver status');

        if(!invitation){
            return res.status(404).json({success: false, message: 'Invitation not found'});
        }

        invitation.status= status;
        await invitation.save();

        if(status === 'accepted'){
            await User.updateOne(
                {_id: invitation.sender._id},
                {$addToSet: {friends: invitation.receiver._id}},
            )
            await User.updateOne(
                {_id: invitation.receiver._id},
                {$addToSet: {friends: invitation.sender._id}},
            )
        }

        return res.status(200).json({success: true, message: `Invitation ${status} successfully`});

    }catch(error){
        return res.status(500).json({success: false, message: 'Server error while responding to invitation'});
    }
}

const cancelSentFriendRequest= async (req, res) => {
    try{
        const userId= req.userId;

        const {inviteId}= req.params;

        const result = await Invite.findOneAndDelete({
            _id: inviteId,
            sender: userId,
            status: 'pending'
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found or already handled'
            });
        }

        return res.status(200).json({success: true, message: 'Friend request cancelled successfully'});

    }catch(error){
        console.log("Error cancelling friend request:", error.message);
        return res.status(500).json({success: false, message: "Error cancelling friend request"});
    }
}

const allFriends= async (req, res) => {
    try{
        const userId= req.userId;

        const user= await User.findById(userId).select('friends').populate('friends', 'firstName lastName username email profilePicture privacySettings').lean();

        return res.status(200).json({success: true, message: "Friends fetched successfully", friends: user.friends});

    }catch(error){
        console.error('Error in allFriends:', error.message);
        return res.status(500).json({success: false, message: 'Server error while fetching friends'});
    }
}

const unfriendUser= async (req, res) => {
    try{
        const userId= req.userId;

        const {friendId}= req.params;

        const user= await User.findById(userId).select('_id friends');
        const friend= await User.findById(friendId).select('_id');

        if(!friend){
            return res.status(404).json({success: false, message: 'User not found'});
        }

        const isFriend= user.friends.some(f => f.toString() === friendId);

        if(!isFriend){
            return res.status(400).json({success: false, message: 'This user is not in your friends list'});
        }

        await User.updateOne(
            {_id: userId},
            {$pull: {friends: friendId}},
        )

        await User.updateOne(
            {_id: friendId},
            {$pull: {friends: userId}},
        )
        
        return res.status(200).json({success: true, message: "Unfriended successfully"});

    }catch(error){
        console.log("Error unfriending user:", error.message);
        return res.status(500).json({success: false, message: "Error unfriending user"});
    }
}


module.exports= {sendRequestToMakeFriend, getMyInvitationsReceived, getMyInvitationsSent, respondToFriendRequest, cancelSentFriendRequest, unfriendUser, allFriends};