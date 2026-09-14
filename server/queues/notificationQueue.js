const { Queue } = require("bullmq");
const { getRedisConfig } = require("../configs/redis");
const Notification = require("../models/Notification");
const { emitToUser } = require("../configs/socket");

const QUEUE_NAME = "notification-queue";

let notificationQueue = null;

const initNotificationQueue = (redisConfig) => {
    try {
        const connection = redisConfig || getRedisConfig();
        notificationQueue = new Queue(QUEUE_NAME, {
            connection,
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

        notificationQueue.on("error", () => {
            // Gracefully handled without uncaught exceptions
        });

        return notificationQueue;
    } catch (err) {
        notificationQueue = null;
        return null;
    }
};

/**
 * Fallback direct delivery if Redis is offline or unavailable.
 * Runs asynchronously without blocking the calling thread.
 */
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
        console.error("Direct notification fallback failed:", err.message);
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
        console.error("Batch notification fallback failed:", err.message);
    }
};

/**
 * Non-blocking asynchronous single notification enqueueing.
 * Pushes notification job to BullMQ queue.
 * Falls back to direct async delivery if queue or Redis is unavailable.
 */
const enqueueNotification = (notificationData) => {
    if (!notificationData || !notificationData.recipient) return;

    if (notificationQueue) {
        notificationQueue
            .add("single-notification", { notification: notificationData })
            .catch((err) => {
                // Redis is offline; execute async fallback without blocking
                fallbackDispatchSingle(notificationData);
            });
        return;
    }

    fallbackDispatchSingle(notificationData);
};

/**
 * Non-blocking asynchronous batch notification enqueueing.
 * Pushes batch notification job to BullMQ queue.
 * Falls back to direct async delivery if queue or Redis is unavailable.
 */
const enqueueNotifications = (notificationsArray) => {
    if (!Array.isArray(notificationsArray) || notificationsArray.length === 0) return;

    if (notificationQueue) {
        notificationQueue
            .add("batch-notifications", { notifications: notificationsArray })
            .catch((err) => {
                // Redis is offline; execute async fallback without blocking
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
        } catch (err) {
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
