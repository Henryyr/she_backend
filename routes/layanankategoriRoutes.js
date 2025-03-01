const express = require('express');
const db = require('../db'); // Import koneksi database
const router = express.Router();

// GET semua kategori layanan
router.get('/', (req, res) => {
    db.query('SELECT * FROM kategori_layanan', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// GET kategori layanan berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM kategori_layanan WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }

        res.json(results[0]);
    });
});

// POST tambah kategori layanan baru
router.post('/', (req, res) => {
    const { nama } = req.body;

    if (!nama) {
        return res.status(400).json({ error: "Nama kategori layanan harus diisi" });
    }

    const sql = 'INSERT INTO kategori_layanan (nama) VALUES (?)';

    db.query(sql, [nama], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ message: 'Kategori layanan berhasil ditambahkan', id: result.insertId });
    });
});

// PUT update kategori layanan berdasarkan ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nama } = req.body;

    const sql = 'UPDATE kategori_layanan SET nama = ? WHERE id = ?';

    db.query(sql, [nama, id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }

        res.json({ message: `Kategori layanan ID ${id} berhasil diperbarui` });
    });
});

// DELETE hapus kategori layanan berdasarkan ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM kategori_layanan WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }

        res.json({ message: `Kategori layanan ID ${id} berhasil dihapus` });
    });
});

module.exports = router;
