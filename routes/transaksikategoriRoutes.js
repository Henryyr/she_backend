const express = require('express');
const router = express.Router();
const { getAllKategoriTransaksi } = require('../controllers/kategoriTransaksiController');
const { authenticate } = require('../middleware/auth');

// ✅ GET semua kategori transaksi
router.get('/', authenticate, getAllKategoriTransaksi);

module.exports = router;
