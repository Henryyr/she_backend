// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter setup - updated to use environment variables and disable debug output
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    silent: true, 
    logger: false,  // Disable logging
    debug: false    // Disable debug output
});

// Test connection and show status
transporter.verify((error) => {
    if (error) {
        console.log('⚠️ Email service not available');
    } else {
        console.log('✅ Email service is ready');
    }
});

// Function to send email - keeping the original function signature
const sendEmail = async (_to, _subject, _text, _html) => {
    try {
        if (!_to) throw new Error("Email tujuan kosong!");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: _to,
            subject: _subject,
            text: _text,
            html: _html,
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'NodeMailer',
            }
        };

        await transporter.sendMail(mailOptions);
        console.log("Email berhasil dikirim ke:", _to);
        return true;
    } catch (error) {
        console.error("Gagal mengirim email:", error);
        throw error;
    }
};

module.exports = {
    sendEmail
};