const Notification = require("../models/Notification.js");
const { emitToUser } = require("../configs/socket.js");
const {
    enqueueNotification,
    enqueueNotifications,
} = require("../queues/notificationQueue.js");

/**
 * Asynchronous, non-blocking single notification creator.
 * Directly enqueues notification to BullMQ queue unless a transactional session is passed.
 */
const createNotification = async (
    { recipient, actor, type, title, message, metadata = {} },
    options = {}
) => {
    if (!recipient || !actor || !type || !title || !message) {
        return null;
    }

    // If caller explicitly passes a transaction session, write within the transaction
    if (options?.session) {
        const doc = new Notification({
            recipient,
            actor,
            type,
            title,
            message,
            metadata,
        });
        await doc.save(options);

        const query = Notification.findById(doc._id)
            .populate("actor", "firstName lastName username profilePicture")
            .lean();
        query.session(options.session);
        const populated = await query;

        emitToUser(recipient, "notification:received", populated || doc);
        return doc;
    }

    // Otherwise, push to BullMQ queue asynchronously for immediate non-blocking execution
    enqueueNotification({
        recipient,
        actor,
        type,
        title,
        message,
        metadata,
    });

    return { recipient, actor, type, title, message, metadata };
};

/**
 * Asynchronous, non-blocking batch notification creator.
 */
const createNotifications = async (notifications = [], options = {}) => {
    const docs = (notifications || []).filter(
        (item) => item?.recipient && item?.type && item?.title && item?.message
    );
    if (docs.length === 0) {
        return [];
    }

    // If caller explicitly passes a transaction session, insert within the session
    if (options?.session) {
        const createdDocs = await Notification.insertMany(docs, { ordered: false, ...options });
        for (const doc of createdDocs) {
            emitToUser(doc.recipient, "notification:received", doc);
        }
        return createdDocs;
    }

    // Otherwise, push to BullMQ queue asynchronously for immediate non-blocking execution
    enqueueNotifications(docs);
    return docs;
};

module.exports = {
    createNotification,
    createNotifications,
    enqueueNotification,
    enqueueNotifications,
};