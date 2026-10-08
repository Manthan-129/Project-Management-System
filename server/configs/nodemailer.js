require("dotenv").config();
const nodemailer = require("nodemailer");
const { assertEmailConfig } = require("./emailConfig");

let transporter = null;

const getTransporter = () => {
    const config = assertEmailConfig();

    if (transporter) {
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    if (process.env.NODE_ENV !== "production") {
        transporter.verify().catch((err) => {
            console.warn(`SMTP verify warning: ${err.message}`);
        });
    }

    return transporter;
};

const getSenderAddress = (displayName = "DevDash Support") => {
    const { senderEmail } = assertEmailConfig();
    return `"${displayName}" <${senderEmail}>`;
};

module.exports = {
    getTransporter,
    getSenderAddress,
};
