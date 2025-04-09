// services/emailService.js
const nodemailer = require('nodemailer');

// Email transporter setup - kept exactly as in original code
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "henry.360420@gmail.com",
        pass: "tklsvkimuouusprw",
    },
    logger: true,
    debug: true,
});

// Function to send email - keeping the original function signature
const sendEmail = async (_to, _subject, _text, _html) => {
    try {
        if (!_to) throw new Error("Email tujuan kosong!");

        const mailOptions = {
            from: "henry.360420@gmail.com",
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