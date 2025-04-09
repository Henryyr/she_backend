const express = require('express');
const { authenticate } = require('../middleware/auth');
const TransaksiController = require('../controllers/transaksiController');
const router = express.Router();

router.post('/', authenticate, TransaksiController.createTransaction);
router.post('/webhook', TransaksiController.handleWebhook);
router.get('/webhook', (_req, res) => {
    console.log("🔔 GET request diterima di webhook (bukan dari Midtrans)");
    res.status(200).json({ message: "Webhook endpoint active, but please use POST method" });
});
router.post('/lunasi', authenticate, TransaksiController.payRemaining);
router.get('/', authenticate, TransaksiController.getUserTransactions);

module.exports = router;