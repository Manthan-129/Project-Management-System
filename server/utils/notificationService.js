const Notification = require("../models/Notification.js");
const { emitToUser } = require("../configs/socket.js");

const createNotification = async ({ recipient, actor, type, title, message, metadata = {} }) => {
    if (!recipient || !actor || !type || !title || !message) {
        return null;
    }
    const doc = await Notification.create({
        recipient,
        actor,
        type,
        title,
        message,
        metadata,
    });

    if (doc) {
        const populated = await Notification.findById(doc._id)
            .populate("actor", "firstName lastName username profilePicture")
            .lean();

        emitToUser(recipient, "notification:received", populated || doc);
    }

    return doc;
};

const createNotifications = async (notifications = []) => {
    const docs = notifications.filter(
        (item) => item?.recipient && item?.type && item?.title && item?.message
    );
    if (docs.length === 0) {
        return [];
    }

    const createdDocs = await Notification.insertMany(docs, { ordered: false });

    // Emit real-time socket events to each recipient
    for (const doc of createdDocs) {
        emitToUser(doc.recipient, "notification:received", doc);
    }

    return createdDocs;
};

module.exports = { createNotification, createNotifications };