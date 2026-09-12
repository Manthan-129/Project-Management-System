const { Worker } = require("bullmq");
const { getRedisConfig } = require("../configs/redis");
const { transporter } = require("../configs/nodemailer");

const QUEUE_NAME = "email-queue";

let emailWorker = null;

const initEmailWorker = (redisConfig) => {
    try {
        const connection = redisConfig || getRedisConfig();

        emailWorker = new Worker(
            QUEUE_NAME,
            async (job) => {
                const { mailOptions } = job.data;
                await transporter.sendMail(mailOptions);
            },
            {
                connection,
                concurrency: 5,
            }
        );

        emailWorker.on("completed", (job) => {
            console.log(`Email job ${job.id} sent successfully.`);
        });

        emailWorker.on("failed", (job, err) => {
            console.warn(`Email job ${job?.id} attempt ${job?.attemptsMade} failed: ${err.message}`);
        });

        emailWorker.on("error", () => {
            // Handled gracefully without uncaught exceptions
        });

        return emailWorker;
    } catch (err) {
        emailWorker = null;
        return null;
    }
};

const closeEmailWorker = async () => {
    if (emailWorker) {
        try {
            await emailWorker.close();
        } catch (err) {
            // Silently handle close errors during shutdown
        }
    }
};

module.exports = {
    initEmailWorker,
    closeEmailWorker,
    getEmailWorker: () => emailWorker,
};
