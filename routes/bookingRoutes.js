const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const cron = require('node-cron');

// Redis client setup
const client = redis.createClient();

// Rate limiter setup
const bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { error: "Terlalu banyak permintaan booking, coba lagi nanti." }
});

// Function to generate booking number
const generateBookingNumber = async () => {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        const sql = `
            SELECT booking_number 
            FROM booking 
            WHERE booking_number LIKE ? 
            ORDER BY booking_number DESC 
            LIMIT 1
        `;

        db.query(sql, [`BKG-${dateStr}-%`], (err, results) => {
            if (err) return reject(err);

            let nextNumber = 1;
            if (results.length > 0) {
                const lastBooking = results[0].booking_number;
                const lastNumber = parseInt(lastBooking.split('-')[2], 10);
                nextNumber = lastNumber + 1;
            }

            const newBookingNumber = `BKG-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
            resolve(newBookingNumber);
        });
    });
};

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "henry.360420@gmail.com",
        pass: "tklsvkimuouusprw",
    },
    logger: true,
    debug: true,
});

// Function to send email
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
    } catch (error) {
        console.error("Gagal mengirim email:", error);
    }
};

// POST buat booking baru
router.post('/', authenticate, bookingLimiter, async (req, res) => {
    const { layanan_id, tanggal, jam_mulai } = req.body;
    const user_id = req.user.id;

    if (!user_id) return res.status(401).json({ error: "User tidak ditemukan, pastikan sudah login" });
    if (!layanan_id || !Array.isArray(layanan_id) || layanan_id.length === 0) 
        return res.status(400).json({ error: "Harus memilih setidaknya satu layanan" });

    try {
        await db.promise().beginTransaction(); // Mulai transaksi

        const [existingBookings] = await db.promise().query(
            `SELECT id FROM booking WHERE user_id = ? AND tanggal = ? FOR UPDATE`,
            [user_id, tanggal]
        );

        if (existingBookings.length > 0) {
            await db.promise().rollback(); // Rollback jika sudah ada booking
            return res.status(400).json({ error: "Anda sudah memiliki booking pada hari ini. Silakan pilih hari lain." });
        }

        const [layananResults] = await db.promise().query(
            `SELECT id, nama, estimasi_waktu, harga FROM layanan WHERE id IN (?)`, 
            [layanan_id]
        );

        if (layananResults.length === 0) {
            await db.promise().rollback(); // Rollback jika layanan tidak ditemukan
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        const total_harga = layananResults.reduce((sum, layanan) => sum + parseFloat(layanan.harga), 0);
        const total_estimasi = layananResults.reduce((sum, layanan) => sum + layanan.estimasi_waktu, 0);
        const bookingNumber = await generateBookingNumber();

        const [result] = await db.promise().query(
            `INSERT INTO booking (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga)
            VALUES (?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), 'pending', ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_mulai, total_estimasi, bookingNumber, parseFloat(total_harga)]
        );

        const booking_id = result.insertId;

        const values = layananResults.map(layanan => [booking_id, layanan.id]);
        if (values.length > 0) {
            await db.promise().query(`INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`, [values]);
        }

        await db.promise().commit(); // Commit transaksi jika semua berhasil

        const [userResults] = await db.promise().query('SELECT email FROM users WHERE id = ?', [user_id]);
        const email = userResults.length > 0 ? userResults[0].email : null;

        console.log("Email penerima:", email);  // Debugging

        const layanan_terpilih = layananResults.map(l => ({
            id: l.id,
            nama: l.nama,
            harga: l.harga
        }));

        if (email) {
            const layananList = layananResults.map(l => `🔹 ${l.nama} (Rp${l.harga})`).join("\n");
            const subject = "Konfirmasi Booking Anda";
            const htmlMessage = `
                <p>Booking baru telah dibuat!</p>
                <ul>${layananResults.map(l => `<li>${l.nama} (Rp${l.harga})</li>`).join('')}</ul>
                <p><strong>Tanggal:</strong> ${tanggal}</p>
                <p><strong>Jam:</strong> ${jam_mulai}</p>
                <p><strong>Total:</strong> Rp${total_harga}</p>
                <p>Kode Booking: <strong>${bookingNumber}</strong></p>
                <br>
                <p>
                    <a href='https://yourdomain.com/confirm/${bookingNumber}' style='padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;'>Konfirmasi Booking</a>
                    <a href='https://yourdomain.com/cancel/${bookingNumber}' style='padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; display: inline-block;'>Batalkan Booking</a>
                </p>`;

            await sendEmail(email, subject, `Booking baru telah dibuat!\n\nDetail Booking:\n${layananList}\nTanggal: ${tanggal}\nJam: ${jam_mulai}\nTotal: Rp${total_harga}\nKode Booking: ${bookingNumber}`, htmlMessage);
        } else {
            console.error("Email tidak ditemukan, tidak bisa mengirim.");
        }

        res.json({ 
            message: "Booking berhasil dibuat!", 
            booking_id, 
            status: "pending", 
            booking_number: bookingNumber, 
            total_harga,
            email,
            layanan_terpilih
        });

    } catch (err) {
        await db.promise().rollback(); // Jika ada error, rollback transaksi
        console.error("Error saat membuat booking:", err);
        res.status(500).json({ error: "Terjadi kesalahan, booking gagal dibuat." });
    }
});


// GET semua booking dengan pagination
router.get('/', authenticate, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const sql = `
            SELECT b.*, u.phone_number, GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            GROUP BY b.id
            LIMIT ? OFFSET ?
        `;
        const [results] = await db.promise().query(sql, [parseInt(limit), parseInt(offset)]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET booking by ID with caching
router.get('/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    client.get(`booking:${id}`, async (err, data) => {
        if (data) {
            return res.json(JSON.parse(data));
        } else {
            const [results] = await db.promise().query('SELECT * FROM booking WHERE id = ?', [id]);
            if (results.length > 0) {
                client.setex(`booking:${id}`, 3600, JSON.stringify(results[0])); // Cache for 1 hour
                res.json(results[0]);
            } else {
                res.status(404).json({ error: "Booking tidak ditemukan" });
            }
        }
    });
});

// Route to send test email
router.get('/send-email', async (req, res) => {
    await sendMail();
    res.send("Email sedang dikirim...");
});

// POST konfirmasi booking
router.post('/confirm/:bookingNumber', authenticate, async (req, res) => {
    const { bookingNumber } = req.params;
    const sql = 'UPDATE booking SET status = ? WHERE booking_number = ?';

    try {
        await db.promise().query(sql, ['confirmed', bookingNumber]);
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST batalkan booking
router.post('/cancel/:bookingNumber', authenticate, async (req, res) => {
    const { bookingNumber } = req.params;
    const sql = 'UPDATE booking SET status = ? WHERE booking_number = ?';

    try {
        await db.promise().query(sql, ['canceled', bookingNumber]);
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE hapus booking
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM booking WHERE id = ?';

    try {
        await db.promise().query(sql, [id]);
        res.json({ message: 'Booking berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cron job to auto-cancel unconfirmed bookings after 24 hours
cron.schedule('0 0 * * *', async () => { // Every midnight
    await db.promise().query(`
        UPDATE booking 
        SET status = 'canceled' 
        WHERE status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > 24
    `);
    console.log("Booking yang tidak dikonfirmasi lebih dari 24 jam telah dibatalkan.");
});

module.exports = router;
