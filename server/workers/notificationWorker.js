const { Worker } = require("bullmq");
const { getRedisConfig, isRedisConfigured, getQueuePrefix } = require("../configs/redis");
const Notification = require("../models/Notification");
const { emitToUser } = require("../configs/socket");

const QUEUE_NAME = "notification-queue";

let notificationWorker = null;

const processSingleNotification = async (notificationData) => {
    const { recipient, actor, type, title, message, metadata = {} } = notificationData;
    if (!recipient || !type || !title || !message) return null;

    const doc = new Notification({
        recipient,
        actor,
        type,
        title,
        message,
        metadata,
    });
    await doc.save();

    const populated = await Notification.findById(doc._id)
        .populate("actor", "firstName lastName username profilePicture")
        .lean();

    emitToUser(recipient, "notification:received", populated || doc);
    return doc;
};

const processBatchNotifications = async (notifications) => {
    const validDocs = (notifications || []).filter(
        (item) => item?.recipient && item?.type && item?.title && item?.message
    );
    if (validDocs.length === 0) return [];

    const createdDocs = await Notification.insertMany(validDocs, { ordered: false });
    for (const doc of createdDocs) {
        emitToUser(doc.recipient, "notification:received", doc);
    }
    return createdDocs;
};

const initNotificationWorker = (redisConfig) => {
    if (!isRedisConfigured()) {
        notificationWorker = null;
        return null;
    }

    try {
        const connection = redisConfig || getRedisConfig();
        if (!connection) {
            notificationWorker = null;
            return null;
        }

        notificationWorker = new Worker(
            QUEUE_NAME,
            async (job) => {
                if (job.name === "single-notification") {
                    const { notification } = job.data;
                    await processSingleNotification(notification);
                } else if (job.name === "batch-notifications") {
                    const { notifications } = job.data;
                    await processBatchNotifications(notifications);
                }
            },
            {
                connection,
                prefix: getQueuePrefix(),
                concurrency: 5,
            }
        );

        notificationWorker.on("failed", (job, err) => {
            console.warn(`Notification job ${job?.id} failed: ${err.message}`);
        });

        notificationWorker.on("error", (err) => {
            console.warn(`Notification worker warning: ${err.message}`);
        });

        return notificationWorker;
    } catch (err) {
        notificationWorker = null;
        console.warn(`Notification worker disabled: ${err.message}`);
        return null;
    }
};

const closeNotificationWorker = async () => {
    if (notificationWorker) {
        try {
            await notificationWorker.close();
        } catch {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initNotificationWorker,
    closeNotificationWorker,
    getNotificationWorker: () => notificationWorker,
};
