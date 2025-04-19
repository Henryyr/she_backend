const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateCreateTransaction, validatePayRemaining } = require('../middleware/transaksiMiddleware');
const TransaksiController = require('../controllers/transaksiController');
const router = express.Router();

router.post('/', authenticate, validateCreateTransaction, TransaksiController.createTransaction);
router.post('/webhook', TransaksiController.handleWebhook);
router.get('/webhook', (_req, res) => {
    console.log("🔔 GET request diterima di webhook (bukan dari Midtrans)");
    res.status(200).json({ message: "Webhook endpoint active, but please use POST method" });
});
router.post('/lunasi', authenticate, validatePayRemaining, TransaksiController.payRemaining);
router.get('/', authenticate, TransaksiController.getUserTransactions);

// Add test endpoint - no auth needed for testing
router.get('/test-receipt', TransaksiController.testQRCode);

module.exports = router;