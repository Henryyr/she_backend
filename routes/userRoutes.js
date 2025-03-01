const express = require('express');
const router = express.Router();
const db = require('../db');

// GET semua users
router.get('/', async (req, res) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM users');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST tambah user baru
router.post('/', async (req, res) => {
    const { fullname, email, phone_number, username, password, address, role } = req.body;
    const sql = 'INSERT INTO users (fullname, email, phone_number, username, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    try {
        const [result] = await db.promise().query(sql, [fullname, email, phone_number, username, password, address, role]);
        res.json({ message: 'User berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
