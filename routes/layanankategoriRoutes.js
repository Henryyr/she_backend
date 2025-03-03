const express = require('express');
const db = require('../db'); // Import koneksi database
const router = express.Router();

// GET semua kategori layanan
router.get('/', async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM kategori_layanan');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET kategori layanan berdasarkan ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.promise().query('SELECT * FROM kategori_layanan WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST tambah kategori layanan baru
router.post('/', async (req, res) => {
    const { nama } = req.body;

    if (!nama) {
        return res.status(400).json({ error: "Nama kategori layanan harus diisi" });
    }

    const sql = 'INSERT INTO kategori_layanan (nama) VALUES (?)';

    try {
        const [result] = await db.promise().query(sql, [nama]);
        res.json({ message: 'Kategori layanan berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update kategori layanan berdasarkan ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nama } = req.body;

    const sql = 'UPDATE kategori_layanan SET nama = ? WHERE id = ?';

    try {
        const [result] = await db.promise().query(sql, [nama, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }
        res.json({ message: `Kategori layanan ID ${id} berhasil diperbarui` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE hapus kategori layanan berdasarkan ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.promise().query('DELETE FROM kategori_layanan WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
        }
        res.json({ message: `Kategori layanan ID ${id} berhasil dihapus` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
