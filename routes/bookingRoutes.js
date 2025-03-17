const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

const API_KEY_WHATSAPP = "6201027";
const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

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

// Function to send WhatsApp notification
const sendWhatsAppNotification = async (phone, message) => {
    try {
        const response = await axios.get(CALLMEBOT_URL, {
            params: {
                phone: phone,
                text: message,
                apikey: API_KEY_WHATSAPP
            }
        });
        console.log("WhatsApp Notification Sent:", response.data);
    } catch (error) {
        console.error("Failed to send WhatsApp message:", error.message);
    }
};

// GET semua booking
router.get('/', authenticate, async (req, res) => {
    try {
        const sql = `
            SELECT b.*, u.phone_number, GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            GROUP BY b.id
        `;
        const [results] = await db.promise().query(sql);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST buat booking baru
router.post('/', authenticate, async (req, res) => {
    const { layanan_id, tanggal, jam_mulai } = req.body;
    const user_id = req.user.id;

    if (!user_id) return res.status(401).json({ error: "User tidak ditemukan, pastikan sudah login" });
    if (!layanan_id || !Array.isArray(layanan_id) || layanan_id.length === 0) 
        return res.status(400).json({ error: "Harus memilih setidaknya satu layanan" });

    try {
        // Periksa apakah user sudah memiliki booking di tanggal yang sama
        const [existingBookings] = await db.promise().query(
            `SELECT id FROM booking WHERE user_id = ? AND tanggal = ?`,
            [user_id, tanggal]
        );

        if (existingBookings.length > 0) {
            return res.status(400).json({ error: "Anda sudah memiliki booking pada hari ini. Silakan pilih hari lain." });
        }

        // Ambil semua layanan berdasarkan array layanan_id
        const [layananResults] = await db.promise().query(
            `SELECT id, nama, estimasi_waktu, harga FROM layanan WHERE id IN (?)`, 
            [layanan_id]
        );

        if (layananResults.length === 0) return res.status(404).json({ error: "Layanan tidak ditemukan" });

        // Hitung total harga dan estimasi waktu
        const total_harga = layananResults.reduce((sum, layanan) => sum + parseFloat(layanan.harga), 0);
        const total_estimasi = layananResults.reduce((sum, layanan) => sum + layanan.estimasi_waktu, 0);

        const bookingNumber = await generateBookingNumber();

        // Simpan booking utama
        const [result] = await db.promise().query(`
            INSERT INTO booking (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga)
            VALUES (?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), 'pending', ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_mulai, total_estimasi, bookingNumber, parseFloat(total_harga)]
        );

        const booking_id = result.insertId;

        // Simpan layanan yang dipesan ke tabel booking_layanan
        const values = layananResults.map(layanan => [booking_id, layanan.id]);
        if (values.length > 0) {
            await db.promise().query(`INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`, [values]);
        }

        // Ambil nomor telepon user
        const [userResults] = await db.promise().query('SELECT phone_number FROM users WHERE id = ?', [user_id]);
        const phone_number = userResults.length > 0 ? userResults[0].phone_number : null;

        // Format daftar layanan yang dipilih
        const layanan_terpilih = layananResults.map(l => ({
            id: l.id,
            nama: l.nama,
            harga: l.harga
        }));

        // Kirim notifikasi WhatsApp jika nomor HP valid
        if (phone_number) {
            const layananList = layananResults.map(l => `🔹 ${l.nama} (Rp${l.harga})`).join("\n");
            const message = `Booking baru telah dibuat!\n\n📌 *Detail Booking:*\n${layananList}\n📅 Tanggal: ${tanggal}\n⏰ Jam: ${jam_mulai}\n💰 Total: Rp${total_harga}\n\nKode Booking: ${bookingNumber}`;
            
            sendWhatsAppNotification(phone_number, message);
        }

        res.json({ 
            message: "Booking berhasil dibuat!", 
            booking_id, 
            status: "pending", 
            booking_number: bookingNumber, 
            total_harga,
            phone_number,
            layanan_terpilih
        });

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

module.exports = router;
