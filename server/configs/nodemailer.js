require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

if (process.env.NODE_ENV !== 'production') {
    transporter.verify().then(() => {
        console.log("Brevo SMTP authenticated successfully");
    }).catch(err => {
        console.warn("Brevo SMTP auth warning:", err.message);
    });
}

module.exports= { transporter };