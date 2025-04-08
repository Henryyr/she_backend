const express = require('express');
const router = express.Router();
const db = require('../db'); // asumsi koneksi DB sudah disiapkan

// ✅ GET semua kategori transaksi
router.get('/', async (req, res) => {
    try {
        const [results] = await db.promise().query(
            `SELECT id, nama FROM kategori_transaksi ORDER BY id ASC`
        );
        res.json({ kategori_transaksi: results });
    } catch (err) {
        console.error("Error saat mengambil kategori transaksi:", err);
        res.status(500).json({ error: "Gagal mengambil data kategori transaksi" });
    }
});

module.exports = router;
