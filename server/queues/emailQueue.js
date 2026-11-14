const { Queue } = require("bullmq");
const { getRedisConfig, isRedisConfigured, getQueuePrefix } = require("../configs/redis");
const { getTransporter } = require("../configs/nodemailer");
const { EMAIL_QUEUE_NAME } = require("./constants");

let emailQueue = null;

const initEmailQueue = (redisConfig) => {
    if (!isRedisConfigured()) {
        emailQueue = null;
        return null;
    }

    try {
        const connection = redisConfig || getRedisConfig();
        if (!connection) {
            emailQueue = null;
            return null;
        }

        emailQueue = new Queue(EMAIL_QUEUE_NAME, {
            connection,
            prefix: getQueuePrefix(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: 100,
            },
        });

        emailQueue.on("error", (err) => {
            console.warn(`Email queue warning: ${err.message}`);
        });

        return emailQueue;
    } catch (err) {
        emailQueue = null;
        console.warn(`Email queue disabled: ${err.message}`);
        return null;
    }
};

const sendDirectEmail = async (mailOptions) => {
    const transporter = getTransporter();
    return transporter.sendMail(mailOptions);
};

const enqueueEmail = async (mailOptions, options = {}) => {
    const { requireDelivery = false } = options;

    if (!mailOptions || !mailOptions.to) {
        const err = new Error("Email payload is invalid. 'to' is required.");
        if (requireDelivery) {
            throw err;
        }
        console.warn(err.message);
        return { delivered: false, queued: false };
    }

    if (requireDelivery) {
        await sendDirectEmail(mailOptions);
        return { delivered: true, queued: false };
    }

    if (emailQueue) {
        try {
            await emailQueue.add("send-email", { mailOptions });
            return { delivered: false, queued: true };
        } catch (err) {
            console.warn(`Email queue add failed, using direct send: ${err.message}`);
        }
    }

    try {
        await sendDirectEmail(mailOptions);
        return { delivered: true, queued: false };
    } catch (err) {
        console.error(`Email delivery failed: ${err.message}`);
        return { delivered: false, queued: false };
    }
};

const closeEmailQueue = async () => {
    if (emailQueue) {
        try {
            await emailQueue.close();
        } catch {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initEmailQueue,
    enqueueEmail,
    closeEmailQueue,
    getEmailQueue: () => emailQueue,
};
