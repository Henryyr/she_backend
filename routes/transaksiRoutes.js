const express = require('express');
const db = require('../db'); // Koneksi database
const { authenticate } = require('../middleware/auth'); // Middleware otentikasi
const router = express.Router();

// ✅ Buat Transaksi Baru
router.post('/', authenticate, async (req, res) => {
    const { booking_id, total_harga, kategori_transaksi_id, qris_provider_id, isPaid } = req.body;
    const user_id = req.user.id; // Dari token user

    if (!booking_id || !total_harga || !kategori_transaksi_id) {
        return res.status(400).json({ error: "Semua data wajib diisi" });
    }

    // 🔹 Validasi kategori_transaksi_id (hanya 1 = Cash, 2 = QRIS)
    if (![1, 2].includes(kategori_transaksi_id)) {
        return res.status(400).json({ error: "Kategori transaksi tidak valid" });
    }

    // 🔹 Validasi total_harga
    if (total_harga <= 0) {
        return res.status(400).json({ error: "Total harga harus lebih dari 0" });
    }

    // 🔹 Jika QRIS, harus pilih qris_provider_id
    if (kategori_transaksi_id === 2 && !qris_provider_id) {
        return res.status(400).json({ error: "QRIS provider harus dipilih" });
    }

    try {
        // 🔹 Cek apakah booking valid dan harga sesuai
        const [bookingResult] = await db.promise().query(`SELECT id, total_harga FROM booking WHERE id = ?`, [booking_id]);
        if (bookingResult.length === 0) {
            return res.status(404).json({ error: "Booking ID tidak ditemukan" });
        }
        const booking = bookingResult[0];

        if (parseFloat(booking.total_harga) !== parseFloat(total_harga)) {
            return res.status(400).json({ error: "Total harga tidak sesuai dengan harga layanan" });
        }

        // 🔹 Jika QRIS dan isPaid = true → langsung paid, kalau tidak tetap pending
        let status = (kategori_transaksi_id === 2 && isPaid) ? "paid" : "pending";

        // 🔹 Mulai Transaksi Database
        await db.promise().beginTransaction();

        // 🔹 Simpan transaksi
        const [result] = await db.promise().query(
            `INSERT INTO transaksi (user_id, booking_id, total_harga, kategori_transaksi_id, qris_provider_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, booking_id, total_harga, kategori_transaksi_id, qris_provider_id || null, status]
        );

        // 🔹 Jika langsung `paid`, update booking jadi `confirmed`
        if (status === "paid") {
            await db.promise().query(`UPDATE booking SET status = "confirmed" WHERE id = ?`, [booking_id]);
        }

        // 🔹 Commit transaksi database
        await db.promise().commit();

        res.json({ message: "Transaksi berhasil dibuat", transaksi_id: result.insertId, status });
    } catch (err) {
        await db.promise().rollback();
        res.status(500).json({ error: err.message });
    }
});

// ✅ Ambil Semua Transaksi User
router.get('/', authenticate, async (req, res) => {
    try {
        const [results] = await db.promise().query(`
            SELECT t.*, k.nama AS metode_pembayaran, q.nama AS qris_provider
            FROM transaksi t
            JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
            LEFT JOIN qris_provider q ON t.qris_provider_id = q.id
            WHERE t.user_id = ?
        `, [req.user.id]);

        res.json({ transactions: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ UPDATE Status Transaksi Menjadi `paid`
router.put('/:id', authenticate, async (req, res) => {
    const { status } = req.body;
    const transaksi_id = req.params.id;

    if (status !== "paid") {
        return res.status(400).json({ error: "Status harus 'paid' untuk menyelesaikan transaksi" });
    }

    try {
        // 🔹 Mulai Transaksi Database
        await db.promise().beginTransaction();

        // 🔹 Update status transaksi
        const [result] = await db.promise().query(
            `UPDATE transaksi SET status = ? WHERE id = ? AND kategori_transaksi_id = 2`,
            [status, transaksi_id]
        );

        if (result.affectedRows === 0) {
            await db.promise().rollback();
            return res.status(404).json({ error: "Transaksi tidak ditemukan atau bukan QRIS" });
        }

        // 🔹 Update status booking jadi `confirmed`
        await db.promise().query(
            `UPDATE booking SET status = 'confirmed' WHERE id = (SELECT booking_id FROM transaksi WHERE id = ?)`,
            [transaksi_id]
        );

        // 🔹 Commit transaksi database
        await db.promise().commit();

        res.json({ message: `Transaksi ID ${transaksi_id} berhasil diupdate menjadi 'paid' dan booking dikonfirmasi.` });
    } catch (err) {
        await db.promise().rollback();
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
