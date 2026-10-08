const { Worker } = require("bullmq");
const { getRedisConfig, isRedisConfigured, getQueuePrefix } = require("../configs/redis");
const { getTransporter } = require("../configs/nodemailer");

const QUEUE_NAME = "email-queue";

let emailWorker = null;

const initEmailWorker = (redisConfig) => {
    if (!isRedisConfigured()) {
        emailWorker = null;
        return null;
    }

    try {
        const connection = redisConfig || getRedisConfig();
        if (!connection) {
            emailWorker = null;
            return null;
        }

        emailWorker = new Worker(
            QUEUE_NAME,
            async (job) => {
                const { mailOptions } = job.data;
                const transporter = getTransporter();
                await transporter.sendMail(mailOptions);
            },
            {
                connection,
                prefix: getQueuePrefix(),
                concurrency: 5,
            }
        );

        emailWorker.on("failed", (job, err) => {
            console.warn(`Email job ${job?.id} failed: ${err.message}`);
        });

        emailWorker.on("error", (err) => {
            console.warn(`Email worker warning: ${err.message}`);
        });

        return emailWorker;
    } catch (err) {
        emailWorker = null;
        console.warn(`Email worker disabled: ${err.message}`);
        return null;
    }
};

const closeEmailWorker = async () => {
    if (emailWorker) {
        try {
            await emailWorker.close();
        } catch {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initEmailWorker,
    closeEmailWorker,
    getEmailWorker: () => emailWorker,
};
