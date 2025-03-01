const express = require('express');
const db = require('../db'); // Import koneksi database
const router = express.Router();

// GET semua layanan
router.get('/', async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM layanan');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET layanan berdasarkan ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.promise().query('SELECT * FROM layanan WHERE id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST tambah layanan baru
router.post('/', async (req, res) => {
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    if (!kategori_id || !nama || !harga || !estimasi_waktu) {
        return res.status(400).json({ error: "Semua field harus diisi" });
    }

    const sql = 'INSERT INTO layanan (kategori_id, nama, harga, estimasi_waktu) VALUES (?, ?, ?, ?)';

    try {
        const [result] = await db.promise().query(sql, [kategori_id, nama, harga, estimasi_waktu]);
        res.json({ message: 'Layanan berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update layanan berdasarkan ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    const sql = 'UPDATE layanan SET kategori_id = ?, nama = ?, harga = ?, estimasi_waktu = ? WHERE id = ?';

    try {
        const [result] = await db.promise().query(sql, [kategori_id, nama, harga, estimasi_waktu, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json({ message: `Layanan ID ${id} berhasil diperbarui` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE hapus layanan berdasarkan ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.promise().query('DELETE FROM layanan WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json({ message: `Layanan ID ${id} berhasil dihapus` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
