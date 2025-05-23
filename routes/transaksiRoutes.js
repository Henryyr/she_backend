const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateCreateTransaction, validatePayRemaining, prioritizeDP } = require('../middleware/transaksiMiddleware');
const TransaksiController = require('../controllers/transaksiController');
const router = express.Router();

// Route untuk mendapatkan opsi pembayaran (DP diprioritaskan)
router.get('/payment-options', authenticate, TransaksiController.getPaymentOptions);

// Route utama dengan prioritas DP
router.post('/', authenticate, prioritizeDP, validateCreateTransaction, TransaksiController.createTransaction);

// Webhook routes
router.post('/webhook', TransaksiController.handleWebhook);
router.get('/webhook', (_req, res) => {
    res.status(200).json({ message: "Webhook endpoint active, but please use POST method" });
});

// Route untuk melunasi sisa pembayaran DP
router.post('/lunasi', authenticate, validatePayRemaining, TransaksiController.payRemaining);

// Route untuk mendapatkan transaksi user
router.get('/', authenticate, TransaksiController.getUserTransactions);

// Route dengan autentikasi
router.get('/status/:order_id', authenticate, TransaksiController.getTransactionStatus);

module.exports = router;