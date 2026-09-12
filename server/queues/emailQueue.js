const { Queue } = require("bullmq");
const { getRedisConfig } = require("../configs/redis");
const { transporter } = require("../configs/nodemailer");

const QUEUE_NAME = "email-queue";

let emailQueue = null;

const initEmailQueue = (redisConfig) => {
    try {
        const connection = redisConfig || getRedisConfig();
        emailQueue = new Queue(QUEUE_NAME, {
            connection,
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

        emailQueue.on("error", () => {
            // Handled gracefully without uncaught exceptions
        });

        return emailQueue;
    } catch (err) {
        emailQueue = null;
        return null;
    }
};

/**
 * Non-blocking asynchronous email enqueueing.
 * Pushes email payload to BullMQ queue.
 * Falls back to direct async SMTP delivery if queue or Redis is unavailable.
 */
const enqueueEmail = (mailOptions) => {
    if (!mailOptions || !mailOptions.to) return;

    if (emailQueue) {
        emailQueue
            .add("send-email", { mailOptions })
            .catch((err) => {
                // Redis is offline or unreachable; fall back to direct async dispatch
                transporter.sendMail(mailOptions).catch((sendErr) => {
                    console.error("Email delivery failed:", sendErr.message);
                });
            });
        return;
    }

    // Direct async fallback delivery
    transporter.sendMail(mailOptions).catch((err) => {
        console.error("Email delivery failed:", err.message);
    });
};

const closeEmailQueue = async () => {
    if (emailQueue) {
        try {
            await emailQueue.close();
        } catch (err) {
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
