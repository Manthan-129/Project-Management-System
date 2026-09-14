const { Worker } = require("bullmq");
const { getRedisConfig } = require("../configs/redis");
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
    try {
        const connection = redisConfig || getRedisConfig();

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
                concurrency: 5,
            }
        );

        notificationWorker.on("completed", (job) => {
            // Completed job processed
        });

        notificationWorker.on("failed", (job, err) => {
            console.warn(
                `Notification job ${job?.id} (${job?.name}) attempt ${job?.attemptsMade} failed: ${err.message}`
            );
        });

        notificationWorker.on("error", () => {
            // Gracefully handled without crashing server
        });

        return notificationWorker;
    } catch (err) {
        notificationWorker = null;
        return null;
    }
};

const closeNotificationWorker = async () => {
    if (notificationWorker) {
        try {
            await notificationWorker.close();
        } catch (err) {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initNotificationWorker,
    closeNotificationWorker,
    getNotificationWorker: () => notificationWorker,
};
