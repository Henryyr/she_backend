const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateCreateTransaction, validatePayRemaining } = require('../middleware/transaksiMiddleware');
const TransaksiController = require('../controllers/transaksiController');
const router = express.Router();

router.post('/', authenticate, validateCreateTransaction, TransaksiController.createTransaction);
router.post('/webhook', TransaksiController.handleWebhook);
router.get('/webhook', (_req, res) => {
    res.status(200).json({ message: "Webhook endpoint active, but please use POST method" });
});
router.post('/lunasi', authenticate, validatePayRemaining, TransaksiController.payRemaining);
router.get('/', authenticate, TransaksiController.getUserTransactions);
router.get('/status/:order_id', authenticate, TransaksiController.getTransactionStatus);

module.exports = router;