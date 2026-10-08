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
    if (!mailOptions || !mailOptions.to) {
        console.error("enqueueEmail error: mailOptions or mailOptions.to is missing", mailOptions);
        return;
    }

    if (emailQueue) {
        emailQueue
            .add("send-email", { mailOptions })
            .then((job) => {
                console.log(`Email job ${job.id} queued for ${mailOptions.to}`);
            })
            .catch((err) => {
                console.warn("Queue add failed, falling back to direct send:", err.message);
                transporter.sendMail(mailOptions).then((info) => {
                    console.log("Fallback email sent successfully to", mailOptions.to, info.messageId);
                }).catch((sendErr) => {
                    console.error("Email delivery failed (fallback):", sendErr.message);
                });
            });
        return;
    }

    // Direct async fallback delivery
    console.log(`Sending email directly to ${mailOptions.to}...`);
    transporter.sendMail(mailOptions).then((info) => {
        console.log("Direct email sent successfully to", mailOptions.to, info.messageId);
    }).catch((err) => {
        console.error("Email delivery failed (direct):", err.message);
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
