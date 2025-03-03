const express = require('express');
const db = require('../db'); // Koneksi database
const { authenticate } = require('../middleware/auth'); // Middleware otentikasi
const router = express.Router();

// Buat Transaksi Baru
router.post('/', authenticate, async (req, res) => {
    const { booking_id, total_harga, kategori_transaksi_id, qris_provider_id } = req.body;
    const user_id = req.user.id; // Dari token user

    if (!booking_id || !total_harga || !kategori_transaksi_id) {
        return res.status(400).json({ error: "Semua data wajib diisi" });
    }

    // Validate kategori_transaksi_id
    if (![1, 2].includes(kategori_transaksi_id)) {
        return res.status(400).json({ error: "Kategori transaksi tidak valid" });
    }

    // Validate total_harga
    if (total_harga <= 0) {
        return res.status(400).json({ error: "Total harga harus lebih dari 0" });
    }

    // Validate qris_provider_id if kategori_transaksi_id is 2
    if (kategori_transaksi_id === 2 && !qris_provider_id) {
        return res.status(400).json({ error: "QRIS provider harus dipilih untuk transaksi QRIS" });
    }

    // Check if booking_id exists and validate total_harga
    const bookingCheckSql = `SELECT id, total_harga FROM booking WHERE id = ?`;
    try {
        const [bookingResult] = await db.promise().query(bookingCheckSql, [booking_id]);
        if (bookingResult.length === 0) {
            return res.status(404).json({ error: "Booking ID tidak ditemukan" });
        }
        const booking = bookingResult[0];
        if (parseFloat(booking.total_harga) !== parseFloat(total_harga)) {
            return res.status(400).json({ error: "Total harga tidak sesuai dengan harga layanan" });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    let status = "pending"; // Default status

    const sql = `INSERT INTO transaksi (user_id, booking_id, total_harga, kategori_transaksi_id, qris_provider_id, status) VALUES (?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.promise().query(sql, [user_id, booking_id, total_harga, kategori_transaksi_id, qris_provider_id || null, status]);
        res.json({ message: "Transaksi berhasil dibuat", transaksi_id: result.insertId, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ambil Semua Transaksi User
router.get('/', authenticate, async (req, res) => {
    const sql = `SELECT t.*, k.nama AS metode_pembayaran, q.nama AS qris_provider
                 FROM transaksi t
                 JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
                 LEFT JOIN qris_provider q ON t.qris_provider_id = q.id
                 WHERE t.user_id = ?`;

    try {
        const [results] = await db.promise().query(sql, [req.user.id]);
        res.json({ transactions: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE status transaksi
router.put('/:id', authenticate, async (req, res) => {
    const { status } = req.body;
    const transaksi_id = req.params.id;

    if (status !== "paid") {
        return res.status(400).json({ error: "Status harus 'paid' untuk menyelesaikan transaksi" });
    }

    const sql = `UPDATE transaksi SET status = ? WHERE id = ? AND kategori_transaksi_id = 2`;

    try {
        const [result] = await db.promise().query(sql, [status, transaksi_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan atau bukan QRIS" });
        }

        const updateBooking = `UPDATE booking SET status = 'confirmed' WHERE id = (SELECT booking_id FROM transaksi WHERE id = ?)`;
        await db.promise().query(updateBooking, [transaksi_id]);

        res.json({ message: `Transaksi ID ${transaksi_id} berhasil diupdate menjadi 'paid' dan booking dikonfirmasi.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
