const { Worker } = require("bullmq");
const { transporter } = require("../configs/nodemailer");

let emailWorker = null;

const initEmailWorker = (redisConfig) => {
    if (!redisConfig) return null;

    try {
        emailWorker = new Worker(
            "email-queue",
            async (job) => {
                const { mailOptions } = job.data;
                await transporter.sendMail(mailOptions);
            },
            {
                connection: redisConfig,
                concurrency: 5,
            }
        );

        emailWorker.on("failed", (job, err) => {
            console.warn(`Email job ${job?.id} attempt ${job?.attemptsMade} failed: ${err.message}`);
        });

        console.log("BullMQ Email Worker initialized.");
        return emailWorker;
    } catch (err) {
        return null;
    }
};

module.exports = { initEmailWorker };
