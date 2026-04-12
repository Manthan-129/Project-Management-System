const User= require('../../models/User');

const DEFAULT_NOTIFICATION_SETTINGS = {
	taskAssignments: false,
	taskUpdates: false,
	pullRequests: false,
	teamInvitations: false,
};

const getNotificationSettings= async (req, res)=>{
	try{
		const userId= req.userId;

		const user= await User.findById(userId).select('notificationSettings');

		if(!user){
			return res.status(404).json({success: false, message: 'User not found'});
		}

		const notificationSettings= {
			...DEFAULT_NOTIFICATION_SETTINGS,
			...(user.notificationSettings || {}),
		};

		return res.status(200).json({
			success: true,
			message: 'Fetched notification settings successfully',
			notificationSettings,
		});
	}catch(error){
		return res.status(500).json({success: false, message: 'Error in Get Notification Settings Function'});
	}
}

const updateNotificationSettings= async (req, res)=>{
	try{
		const userId= req.userId;
		const settings= req.body;

		if(!settings || typeof settings !== 'object'){
			return res.status(400).json({success: false, message: 'Notification settings data is required and must be an object'});
		}

		const {taskAssignments, taskUpdates, pullRequests, teamInvitations}= settings;

		if(taskAssignments === undefined && taskUpdates === undefined && pullRequests === undefined && teamInvitations === undefined){
			return res.status(400).json({success: false, message: 'At least one notification setting is required'});
		}

		if((taskAssignments !== undefined && typeof taskAssignments !== 'boolean') ||
			(taskUpdates !== undefined && typeof taskUpdates !== 'boolean') ||
			(pullRequests !== undefined && typeof pullRequests !== 'boolean') ||
			(teamInvitations !== undefined && typeof teamInvitations !== 'boolean')){
			return res.status(400).json({success: false, message: 'All notification setting values must be true/false'});
		}

		const updateFields= {};

		if(taskAssignments !== undefined){
			updateFields['notificationSettings.taskAssignments']= taskAssignments;
		}
		if(taskUpdates !== undefined){
			updateFields['notificationSettings.taskUpdates']= taskUpdates;
		}
		if(pullRequests !== undefined){
			updateFields['notificationSettings.pullRequests']= pullRequests;
		}
		if(teamInvitations !== undefined){
			updateFields['notificationSettings.teamInvitations']= teamInvitations;
		}

		const user= await User.findByIdAndUpdate(userId, {$set: updateFields}, {new: true, runValidators: true}).select('notificationSettings');

		if(!user){
			return res.status(404).json({success: false, message: 'User not found'});
		}

		const notificationSettings= {
			...DEFAULT_NOTIFICATION_SETTINGS,
			...(user.notificationSettings || {}),
		};

		return res.status(200).json({
			success: true,
			message: 'Notification settings updated successfully',
			notificationSettings,
		});
	}catch(error){
		return res.status(500).json({success: false, message: 'Error in Update Notification Settings Function'});
	}
}

module.exports= { getNotificationSettings, updateNotificationSettings };
