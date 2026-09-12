const Notification = require("../models/Notification.js");
const { emitToUser } = require("../configs/socket.js");

const createNotification = async ({ recipient, actor, type, title, message, metadata = {} }, options = {}) => {
    if (!recipient || !actor || !type || !title || !message) {
        return null;
    }
    const doc = new Notification({
        recipient,
        actor,
        type,
        title,
        message,
        metadata,
    });
    await doc.save(options);

    if (doc) {
        const query = Notification.findById(doc._id)
            .populate("actor", "firstName lastName username profilePicture")
            .lean();
        if (options?.session) {
            query.session(options.session);
        }
        const populated = await query;

        emitToUser(recipient, "notification:received", populated || doc);
    }

    return doc;
};

const createNotifications = async (notifications = [], options = {}) => {
    const docs = notifications.filter(
        (item) => item?.recipient && item?.type && item?.title && item?.message
    );
    if (docs.length === 0) {
        return [];
    }

    const createdDocs = await Notification.insertMany(docs, { ordered: false, ...options });

    // Emit real-time socket events to each recipient
    for (const doc of createdDocs) {
        emitToUser(doc.recipient, "notification:received", doc);
    }

    return createdDocs;
};

module.exports = { createNotification, createNotifications };