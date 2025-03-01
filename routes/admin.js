const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, isAdmin, (req, res) => {
    res.json({ message: "Selamat datang di dashboard admin!", user: req.user });
});

module.exports = router;
