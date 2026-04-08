require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter= nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user : process.env.SMTP_USER,
        pass : process.env.SMTP_PASS,
    }
});

(async ()=>{
    try{
        await transporter.verify();
        console.log("Brevo SMTP authenticated successfully");
    } catch (error) {
    console.error("Brevo SMTP authentication failed:", error.message);
  }
})();

module.exports= { transporter };