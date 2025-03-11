const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

const API_KEY_WHATSAPP = "6201027"; // Ganti dengan API Key yang benar
const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php?phone=6289675694072&text=This+is+a+test&apikey=6201027";

// Function to generate booking number
const generateBookingNumber = async () => {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // Format YYYYMMDD

        // Query untuk mendapatkan nomor booking terakhir di hari ini
        const sql = `
            SELECT booking_number 
            FROM booking 
            WHERE booking_number LIKE ? 
            ORDER BY booking_number DESC 
            LIMIT 1
        `;
        
        db.query(sql, [`BKG-${dateStr}-%`], (err, results) => {
            if (err) return reject(err);

            let nextNumber = 1; // Default jika belum ada booking hari ini
            if (results.length > 0) {
                const lastBooking = results[0].booking_number;
                const lastNumber = parseInt(lastBooking.split('-')[2], 10);
                nextNumber = lastNumber + 1;
            }

            // Format ke 3 digit, contoh: BKG-20250311-001
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
            SELECT b.*, u.phone_number 
            FROM booking b
            JOIN users u ON b.user_id = u.id
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
    if (!layanan_id || !tanggal || !jam_mulai) return res.status(400).json({ error: "Semua data wajib diisi" });

    try {
        const [layananResults] = await db.promise().query('SELECT nama, estimasi_waktu, harga FROM layanan WHERE id = ?', [layanan_id]);
        if (layananResults.length === 0) return res.status(404).json({ error: "Layanan tidak ditemukan" });

        const { nama, estimasi_waktu, harga } = layananResults[0];
        const bookingNumber = await generateBookingNumber();

        // Simpan booking
        const sql = `
            INSERT INTO booking (user_id, layanan_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga)
            VALUES (?, ?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), 'pending', ?, ?)
        `;
        const [result] = await db.promise().query(sql, [user_id, layanan_id, tanggal, jam_mulai, jam_mulai, estimasi_waktu, bookingNumber, harga]);

        // Ambil nomor telepon user
        const [userResults] = await db.promise().query('SELECT phone_number FROM users WHERE id = ?', [user_id]);
        const phone_number = userResults.length > 0 ? userResults[0].phone_number : null;

        // Kirim notifikasi WhatsApp jika nomor HP valid
        if (phone_number) {
            const message = `Booking baru telah dibuat!\n\n📌 *Detail Booking:*\n🔹 Layanan: ${nama}\n📅 Tanggal: ${tanggal}\n⏰ Jam: ${jam_mulai}\n💰 Harga: Rp${harga}\n\nKode Booking: ${bookingNumber}`;
            const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone_number}&text=${encodeURIComponent(message)}&apikey=6201027`;

            // Kirim pesan dengan Axios
            axios.get(whatsappUrl)
                .then(() => console.log(`WhatsApp Notification Sent to ${phone_number}`))
                .catch((err) => console.error("WhatsApp API Error:", err.message));
        }

        res.json({ 
            message: "Booking berhasil dibuat!", 
            booking_id: result.insertId, 
            status: "pending", 
            booking_number: bookingNumber, 
            total_harga: harga,
            phone_number 
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
