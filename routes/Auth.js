const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Import koneksi database
const { authenticate, isAdmin } = require('../middleware/auth'); // Import middleware
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
};

// REGISTER (Membuat User Baru)
router.post('/register', async (req, res) => {
    const { fullname, email, phone_number, username, password, confirmation_password, address, role = "pelanggan" } = req.body;

    if (!fullname || !email || !username || !password || !confirmation_password) {
        return res.status(400).json({ error: "Semua data wajib diisi" });
    }

    if (password !== confirmation_password) {
        return res.status(400).json({ error: "Konfirmasi password tidak cocok" });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: "Password harus minimal 8 karakter, mengandung huruf dan angka" });
    }

    try {
        // Hash password sebelum disimpan ke database
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (fullname, email, phone_number, username, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [fullname, email, phone_number, username, hashedPassword, address, role], (err, result) => {
            if (err) return res.status(500).json({ error: err });

            res.json({ message: 'User berhasil didaftarkan', id: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan saat registrasi" });
    }
});

// LOGIN (Autentikasi User)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const sql = `SELECT * FROM users WHERE username = ?`;

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(401).json({ error: "Username atau password salah" });
        }

        const user = results[0];

        // Cek password dengan bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Username atau password salah" });
        }

        // Generate JWT Token dengan masa berlaku 3 jam
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '3h' }
        );

        res.json({ message: "Login berhasil", token });
    });
});

// LOGOUT (Sederhana, Hanya Hapus Token di Client)
router.post('/logout', (req, res) => {
    res.json({ message: "Logout berhasil, silakan hapus token di client" });
});

// ROUTE TERPROTEKSI (Hanya bisa diakses oleh user yang sudah login)
router.get('/profile', authenticate, (req, res) => {
    res.json({ message: "Profil user", user: req.user });
});

module.exports = router;
