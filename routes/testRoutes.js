const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/user/emailService');
const { pool } = require('../db'); // Impor pool untuk mengambil data user

// Endpoint: POST /api/email/test-reminder
// Memicu pengiriman email pengingat ke user yang sedang login.
router.post('/test-reminder', authenticate, async (req, res) => {
    try {
        const { serviceName, bookingTime } = req.body;

        // Validasi input, sekarang lebih sederhana
        if (!serviceName || !bookingTime) {
            return res.status(400).json({ error: 'Input "serviceName" dan "bookingTime" diperlukan.' });
        }

        // Ambil data user lengkap dari database menggunakan ID dari token
        const userId = req.user.id;
        const [users] = await pool.query('SELECT fullname, email FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }
        const currentUser = users[0];

        console.log(`[TEST] Memicu pengiriman email pengingat ke user: ${currentUser.email}`);

        // Buat objek booking palsu menggunakan data user yang login
        const mockBookingData = {
            nama_customer: currentUser.fullname,
            email: currentUser.email,
            tanggal: new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar', year: 'numeric', month: 'long', day: 'numeric' }),
            jam_mulai: bookingTime,
            layanan: serviceName
        };

        // Kirim email pengingat
        await emailService.sendBookingReminder(currentUser.email, mockBookingData);

        res.status(200).json({
            success: true,
            message: `Email pengingat palsu berhasil dikirim ke alamat email Anda (${currentUser.email}). Silakan cek inbox.`
        });

    } catch (error) {
        console.error('[TEST] Gagal mengirim email pengingat:', error);
        res.status(500).json({ error: 'Gagal memicu pengiriman email.', details: error.message });
    }
});


// Endpoint lama untuk tes umum (jika masih diperlukan)
const { testEmailController } = require('../controllers/user/testController');
router.get('/email', authenticate, testEmailController);


module.exports = router;