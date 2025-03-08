const express = require('express');
const db = require('../db'); // Koneksi database
const { authenticate } = require('../middleware/auth'); // Middleware otentikasi
const router = express.Router();

// Create Testimonial (User Submit Testimoni)
router.post('/', authenticate, (req, res) => {
    const { service_id, rating, comment } = req.body;
    const user_id = req.user.id; // Ambil user_id dari token JWT

    if (!service_id || !rating || !comment) {
        return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    const sql = `INSERT INTO testimoni (user_id, service_id, rating, comment) VALUES (?, ?, ?, ?)`;
    db.query(sql, [user_id, service_id, rating, comment], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ message: "Testimoni berhasil ditambahkan", id: result.insertId });
    });
});

// Read All Testimonials
router.get('/', (req, res) => {
    const sql = `
        SELECT t.id, u.username, s.service_name, t.rating, t.comment, t.created_at
        FROM testimoni t
        JOIN users u ON t.user_id = u.id
        JOIN services s ON t.service_id = s.id
        ORDER BY t.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        res.json(results);
    });
});

// Delete Testimonial (Hanya admin bisa hapus)
router.delete('/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Hanya admin yang bisa menghapus testimoni" });
    }

    const { id } = req.params;
    const sql = `DELETE FROM testimoni WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Testimoni tidak ditemukan" });
        }

        res.json({ message: "Testimoni berhasil dihapus" });
    });
});

module.exports = router;