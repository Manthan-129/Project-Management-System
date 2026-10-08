require('dotenv').config();
const nodemailer = require('nodemailer');

const port = Number(process.env.SMTP_PORT) || 465;
const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: port,
    secure: secure,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const getSenderAddress = (displayName = "DevDash Support") => {
    let email = process.env.SENDER_EMAIL;

    if (!email && process.env.SMTP_USER && process.env.SMTP_USER.includes("@") && !process.env.SMTP_USER.endsWith("@smtp-brevo.com")) {
        email = process.env.SMTP_USER;
    }

    if (!email) {
        email = "manthan29singla@gmail.com";
    }

    return `"${displayName}" <${email}>`;
};

if (process.env.NODE_ENV !== 'production') {
    transporter.verify().then(() => {
        console.log("Brevo SMTP authenticated successfully");
    }).catch(err => {
        console.warn("Brevo SMTP auth warning:", err.message);
    });
}

module.exports = { transporter, getSenderAddress };