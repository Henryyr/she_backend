const express = require('express');
const router = express.Router();
const db = require('../db');

// GET semua users
router.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// POST tambah user baru
router.post('/', (req, res) => {
    const { fullname, email, phone_number, username, password, address, role } = req.body;
    const sql = 'INSERT INTO users (fullname, email, phone_number, username, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [fullname, email, phone_number, username, password, address, role], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'User berhasil ditambahkan', id: result.insertId });
    });
});

module.exports = router;
