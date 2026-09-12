const { Queue } = require("bullmq");
const { transporter } = require("../configs/nodemailer");

let emailQueue = null;

const initEmailQueue = (redisConfig) => {
    if (!redisConfig) return null;
    try {
        emailQueue = new Queue("email-queue", {
            connection: redisConfig,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });
        return emailQueue;
    } catch (err) {
        emailQueue = null;
        return null;
    }
};

/**
 * Enqueue email with BullMQ if available, otherwise direct async delivery.
 */
const enqueueEmail = async (mailOptions) => {
    if (!mailOptions || !mailOptions.to) return;

    if (emailQueue) {
        try {
            await emailQueue.add("send-email", { mailOptions });
            return;
        } catch (err) {
            // Fallback to direct async send if queue fails
        }
    }

    // Direct non-blocking async email delivery
    transporter.sendMail(mailOptions).catch((err) => {
        console.error("Email delivery error:", err.message);
    });
};

module.exports = {
    initEmailQueue,
    enqueueEmail,
};
