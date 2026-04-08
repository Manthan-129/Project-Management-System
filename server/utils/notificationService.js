const Notification= require('../models/Notification.js')

const createNotification= async ({recipient, actor, type, title, message, metadata= {}}) => {
    if(!recipient || !actor || !type || !title || !message){
        return null;
    }
    return Notification.create({
        recipient,
        actor,
        type,
        title,
        message,
        metadata,
    });
}

const createNotifications = async (notifications = []) => {
    const docs = notifications.filter((item) => item?.recipient && item?.type && item?.title && item?.message);
    if (docs.length === 0) {
        return [];
    }

    return Notification.insertMany(docs, { ordered: false });
};

module.exports = { createNotification, createNotifications };