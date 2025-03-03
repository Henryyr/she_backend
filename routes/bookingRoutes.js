const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Function to generate booking number
const generateBookingNumber = async () => {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // Format YYYYMMDD

        // Get the last booking number for today
        const sql = `SELECT booking_number FROM booking WHERE booking_number LIKE ? ORDER BY booking_number DESC LIMIT 1`;
        db.query(sql, [`BKG-${dateStr}-%`], (err, results) => {
            if (err) return reject(err);

            let nextNumber = 1; // Default if no bookings yet
            if (results.length > 0) {
                // Get the last sequence number
                const lastBooking = results[0].booking_number;
                const lastNumber = parseInt(lastBooking.split('-')[2], 10);
                nextNumber = lastNumber + 1; // Increment by 1
            }

            const newBookingNumber = `BKG-${dateStr}-${String(nextNumber).padStart(3, '0')}`; // Format to 3 digits
            resolve(newBookingNumber);
        });
    });
};

// GET semua booking
router.get('/', authenticate, async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM booking');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST buat booking baru
router.post('/', authenticate, async (req, res) => {
    const { layanan_id, tanggal, jam_mulai } = req.body;
    const user_id = req.user.id; // Ambil ID user dari token

    if (!user_id) {
        return res.status(401).json({ error: "User tidak ditemukan, pastikan sudah login" });
    }

    if (!layanan_id || !tanggal || !jam_mulai) {
        return res.status(400).json({ error: "Semua data wajib diisi" });
    }

    try {
        const [layananResults] = await db.promise().query('SELECT estimasi_waktu, harga FROM layanan WHERE id = ?', [layanan_id]);
        if (layananResults.length === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        const { estimasi_waktu, harga } = layananResults[0]; // dalam menit dan harga
        const bookingNumber = await generateBookingNumber();

        const sql = `
            INSERT INTO booking (user_id, layanan_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga)
            VALUES (?, ?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), 'pending', ?, ?)
        `;

        const [result] = await db.promise().query(sql, [user_id, layanan_id, tanggal, jam_mulai, jam_mulai, estimasi_waktu, bookingNumber, harga]);
        res.json({ message: 'Booking berhasil dibuat', booking_id: result.insertId, status: 'pending', booking_number: bookingNumber, total_harga: harga });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update booking
router.put('/:id', authenticate, async (req, res) => {
    const { status } = req.body;
    const transaksi_id = req.params.id;

    if (status !== "paid") {
        return res.status(400).json({ error: "Status harus 'paid' untuk menyelesaikan transaksi" });
    }

    const sql = `UPDATE transaksi SET status = ? WHERE id = ?`;

    try {
        const [result] = await db.promise().query(sql, [status, transaksi_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        }

        const updateBooking = `UPDATE booking SET status = 'confirmed' WHERE id = (SELECT booking_id FROM transaksi WHERE id = ?)`;
        await db.promise().query(updateBooking, [transaksi_id]);

        res.json({ message: `Transaksi ID ${transaksi_id} berhasil diupdate menjadi 'paid' dan booking dikonfirmasi.` });
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
