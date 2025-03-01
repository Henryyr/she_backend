const express = require('express');
const router = express.Router();
const db = require('../db');

// GET semua booking
router.get('/', (req, res) => {
    db.query('SELECT * FROM booking', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// POST buat booking baru
router.post('/', (req, res) => {
    const { user_id, layanan_id, tanggal, jam_mulai, status } = req.body;

    // Ambil estimasi_waktu dari layanan
    db.query('SELECT estimasi_waktu FROM layanan WHERE id = ?', [layanan_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        const estimasi_waktu = results[0].estimasi_waktu; // dalam menit
        
        // Hitung jam_selesai (jam_mulai + estimasi_waktu)
        const sql = `
            INSERT INTO booking (user_id, layanan_id, tanggal, jam_mulai, jam_selesai, status)
            VALUES (?, ?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), ?)
        `;

        db.query(sql, [user_id, layanan_id, tanggal, jam_mulai, jam_mulai, estimasi_waktu, status], (err, result) => {
            if (err) return res.status(500).json({ error: err });

            res.json({ message: 'Booking berhasil dibuat', id: result.insertId });
        });
    });
});

// PUT update booking
router.put('/:id', (req, res) => {
    const { status } = req.body; // Status baru (pending, confirmed, completed, cancelled)
    const { id } = req.params;   // ID booking

    // Pastikan status yang dikirim valid
    const validStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatus.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid" });
    }

    const sql = 'UPDATE booking SET status = ? WHERE id = ?';

    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Booking tidak ditemukan" });
        }

        res.json({ message: `Booking ID ${id} berhasil diperbarui menjadi '${status}'` });
    });
});

// DELETE hapus booking
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM booking WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Booking berhasil dihapus' });
    });
});

module.exports = router;
