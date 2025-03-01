const express = require('express');
const db = require('../db'); // Import koneksi database
const router = express.Router();

// GET semua layanan
router.get('/', (req, res) => {
    db.query('SELECT * FROM layanan', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET layanan berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM layanan WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        res.json(results[0]);
    });
});

// POST tambah layanan baru
router.post('/', (req, res) => {
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    if (!kategori_id || !nama || !harga || !estimasi_waktu) {
        return res.status(400).json({ error: "Semua field harus diisi" });
    }

    const sql = 'INSERT INTO layanan (kategori_id, nama, harga, estimasi_waktu) VALUES (?, ?, ?, ?)';

    db.query(sql, [kategori_id, nama, harga, estimasi_waktu], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ message: 'Layanan berhasil ditambahkan', id: result.insertId });
    });
});

// PUT update layanan berdasarkan ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    const sql = 'UPDATE layanan SET kategori_id = ?, nama = ?, harga = ?, estimasi_waktu = ? WHERE id = ?';

    db.query(sql, [kategori_id, nama, harga, estimasi_waktu, id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        res.json({ message: `Layanan ID ${id} berhasil diperbarui` });
    });
});

// DELETE hapus layanan berdasarkan ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM layanan WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }

        res.json({ message: `Layanan ID ${id} berhasil dihapus` });
    });
});

module.exports = router;
