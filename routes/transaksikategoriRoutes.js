const express = require('express');
const router = express.Router();
const { getAllKategoriTransaksi } = require('../controllers/kategoriTransaksiController');

// ✅ GET semua kategori transaksi
router.get('/', getAllKategoriTransaksi);

module.exports = router;
