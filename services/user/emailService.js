const nodemailer = require('nodemailer');
require('dotenv').config();

const bookingEmailTemplate = require('../../html/booking-information');
const invoiceEmailTemplate = require('../../html/transactionReceipt');
const resetPasswordTemplate = require('../../html/reset-password');

// Email transporter setup (Namecheap SMTP)
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465, // gunakan 465 untuk SSL, 587 untuk TLS
  secure: true, // true untuk port 465, false untuk 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: false,
  debug: false
});

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
      from: `"She Salon" <${process.env.EMAIL_USER}>`,
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

// Fungsi khusus kirim informasi booking ke user
const sendBookingInformation = async (toEmail, bookingData) => {
  try {
    // Memanggil sendEmail dengan template booking
    await sendEmail(
      toEmail,
      bookingEmailTemplate.subject,
      bookingEmailTemplate.text(bookingData),
      bookingEmailTemplate.html(bookingData)
    );
    console.log(`[EmailService] Booking information email sent to: ${toEmail}`);
  } catch (error) {
    console.error('[EmailService] Error sending booking information email:', error);
    throw error;
  }
};

// Fungsi kirim invoice
const sendInvoice = async (toEmail, customerName, invoiceData) => {
  try {
    const invoiceHTML = await invoiceEmailTemplate(invoiceData);
    await sendEmail(
      toEmail,
      'Invoice Booking Anda di She Salon',
      `Halo ${customerName}, berikut invoice booking Anda.`,
      invoiceHTML
    );
    console.log('✅ Invoice berhasil dikirim ke:', toEmail);
    return true;
  } catch (error) {
    console.error('❌ Gagal mengirim invoice:', error);
    throw error;
  }
};

// Fungsi khusus kirim email reset password
const sendPasswordResetEmail = async (toEmail, fullname, resetToken) => {
  try {
    const resetUrl = `https://shesalon.store/reset-password?token=${resetToken}`;
    const { subject, text, html } = resetPasswordTemplate({ fullname, resetUrl });
    await sendEmail(toEmail, subject, text, html);
    console.log(`[EmailService] Password reset email sent to: ${toEmail}`);
  } catch (error) {
    console.error('[EmailService] Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendTestEmailToUser,
  sendBookingInformation,
  sendInvoice,
  sendPasswordResetEmail
};
