const express = require('express');
const db = require('../db'); // Koneksi database
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// ==================== DASHBOARD ADMIN ====================
// (Hanya bisa diakses oleh admin)
router.get('/admin/dashboard', authenticate, isAdmin, (req, res) => {
    const sql = "SELECT id, fullname, email, phone_number, username, address, role FROM users";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Terjadi kesalahan", error: err });

        res.json({
            message: "Dashboard Admin - Daftar Pengguna",
            users: results
        });
    });
});

// ==================== CRUD USER ====================

// **1️⃣ Tambah User (Admin Bisa Tambah User)**
router.post('/admin/users', authenticate, isAdmin, (req, res) => {
    const { fullname, email, phone_number, username, password, address, role } = req.body;

    if (!fullname || !email || !username || !password) {
        return res.status(400).json({ message: "Semua data wajib diisi" });
    }

    const sql = "INSERT INTO users (fullname, email, phone_number, username, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [fullname, email, phone_number, username, password, address, role], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menambah user", error: err });

        res.json({ message: "User berhasil ditambahkan", userId: result.insertId });
    });
});

// **2️⃣ Edit User (Admin Bisa Edit User)**
router.put('/admin/users/:id', authenticate, isAdmin, (req, res) => {
    const { id } = req.params;
    const { fullname, email, phone_number, username, address, role } = req.body;

    const sql = "UPDATE users SET fullname = ?, email = ?, phone_number = ?, username = ?, address = ?, role = ? WHERE id = ?";

    db.query(sql, [fullname, email, phone_number, username, address, role, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal memperbarui user", error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil diperbarui" });
    });
});

// **3️⃣ Hapus User (Admin Bisa Hapus User)**
router.delete('/admin/users/:id', authenticate, isAdmin, (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM users WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menghapus user", error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil dihapus" });
    });
});

module.exports = router;
