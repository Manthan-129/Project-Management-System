const { Queue } = require("bullmq");
const { getRedisConfig, isRedisConfigured, getQueuePrefix } = require("../configs/redis");
const Notification = require("../models/Notification");
const { emitToUser } = require("../configs/socket");

const QUEUE_NAME = "notification-queue";

let notificationQueue = null;

const initNotificationQueue = (redisConfig) => {
    if (!isRedisConfigured()) {
        notificationQueue = null;
        return null;
    }

    try {
        const connection = redisConfig || getRedisConfig();
        if (!connection) {
            notificationQueue = null;
            return null;
        }
        notificationQueue = new Queue(QUEUE_NAME, {
            connection,
            prefix: getQueuePrefix(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: true,
            },
        });

        notificationQueue.on("error", (err) => {
            console.warn(`Notification queue warning: ${err.message}`);
        });

        return notificationQueue;
    } catch (err) {
        notificationQueue = null;
        console.warn(`Notification queue disabled: ${err.message}`);
        return null;
    }
};

const fallbackDispatchSingle = async (notificationData) => {
    try {
        const { recipient, actor, type, title, message, metadata = {} } = notificationData;
        if (!recipient || !type || !title || !message) return;

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
    } catch (err) {
        console.error(`Direct notification fallback failed: ${err.message}`);
    }
};

const fallbackDispatchBatch = async (notifications) => {
    try {
        const validDocs = (notifications || []).filter(
            (item) => item?.recipient && item?.type && item?.title && item?.message
        );
        if (validDocs.length === 0) return;

        const createdDocs = await Notification.insertMany(validDocs, { ordered: false });
        for (const doc of createdDocs) {
            emitToUser(doc.recipient, "notification:received", doc);
        }
    } catch (err) {
        console.error(`Batch notification fallback failed: ${err.message}`);
    }
};

const enqueueNotification = (notificationData) => {
    if (!notificationData || !notificationData.recipient) return;

    if (notificationQueue) {
        notificationQueue
            .add("single-notification", { notification: notificationData })
            .catch(() => {
                fallbackDispatchSingle(notificationData);
            });
        return;
    }

    fallbackDispatchSingle(notificationData);
};

const enqueueNotifications = (notificationsArray) => {
    if (!Array.isArray(notificationsArray) || notificationsArray.length === 0) return;

    if (notificationQueue) {
        notificationQueue
            .add("batch-notifications", { notifications: notificationsArray })
            .catch(() => {
                fallbackDispatchBatch(notificationsArray);
            });
        return;
    }

    fallbackDispatchBatch(notificationsArray);
};

const closeNotificationQueue = async () => {
    if (notificationQueue) {
        try {
            await notificationQueue.close();
        } catch {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initNotificationQueue,
    enqueueNotification,
    enqueueNotifications,
    closeNotificationQueue,
    getNotificationQueue: () => notificationQueue,
};
