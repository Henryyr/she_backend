const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    silent: true, 
    logger: false,
    debug: false
});

// Test connection and show status
transporter.verify((error) => {
    if (error) {
        console.log('⚠️ Email service not available');
    } else {
        console.log('✅ Email service is ready');
    }
});

// Fungsi umum kirim email
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
        console.log("✅ Email berhasil dikirim ke:", _to);
        return true;
    } catch (error) {
        console.error("❌ Gagal mengirim email:", error);
        throw error;
    }
};

// Fungsi khusus kirim test email ke user login
const sendTestEmailToUser = async (user) => {
    try {
        if (!user || !user.email) {
            throw new Error('User tidak valid atau tidak memiliki email');
        }

        await sendEmail(
            user.email,
            'Test Email dari She Salon',
            'Ini adalah email percobaan dari sistem She Salon.',
            `<p>Hai ${user.name || 'Pengguna'}, ini adalah email percobaan dari She Salon. 🎉</p>`
        );

        console.log(`✅ Test email berhasil dikirim ke ${user.email}`);
        return true;
    } catch (error) {
        console.error('❌ Gagal kirim test email ke user:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendTestEmailToUser
};
