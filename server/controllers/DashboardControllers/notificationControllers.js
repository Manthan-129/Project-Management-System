const Notification = require("../../models/Notification");

const getMyNotifications= async (req, res) => {
    try{
        const userId= req.userId;

        const notifications= await Notification.find({ recipient: userId })
        .populate('actor', 'firstName lastName username profilePicture')
        .sort({createdAt: -1})
        .limit(100)
        .lean();

        const unreadCount= await Notification.countDocuments({ recipient: userId, isRead: false });

        return res.status(200).json({ success: true, message:"Notifications of the User",notifications, unreadCount });

    }catch(error){
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const markNotificationRead= async (req, res) => {
    try{
        const userId= req.userId;
        const {notificationId}= req.params;

        const notification= await Notification.findOneAndUpdate(
            {_id: notificationId, recipient: userId},
            {$set: {isRead: true}},
            {new: true}
        );

        if(!notification){
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification marked as read' });

    }catch(error){
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const markAllNotificationsRead= async (req, res) => {
    try{
        const userId= req.userId;
        
        await Notification.updateMany(
            {recipient: userId, isRead: false},
            {$set: {isRead: true}},
        )

        return res.status(200).json({success: true, message: 'All notifications marked as read'});
        
    }catch(error){
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports= {getMyNotifications, markNotificationRead, markAllNotificationsRead};