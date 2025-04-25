const TransaksiService = require('../services/transaksiService');
const transactionReceiptTemplate = require('../html/transactionReceipt');

class TransaksiController {
    async createTransaction(req, res) {
        try {
            const { booking_id, kategori_transaksi_id, is_dp } = req.body;
            const user_id = req.user.id;
            const result = await TransaksiService.createTransaction(booking_id, kategori_transaksi_id, is_dp, user_id);
            res.json(result);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async handleWebhook(req, res) {
        try {
            const result = await TransaksiService.handleWebhook(req.body);
            res.json(result);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async payRemaining(req, res) {
        try {
            const { transaksi_id } = req.body;
            const user_id = req.user.id;
            const result = await TransaksiService.payRemaining(transaksi_id, user_id);
            res.json(result);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async getUserTransactions(req, res) {
        try {
            const user_id = req.user.id;
            const transactions = await TransaksiService.getUserTransactions(user_id);
            res.json({ transactions });
        } catch (error) {
            res.status(error.status || 500).json({ 
                error: error.message || "Internal Server Error",
                details: process.env.NODE_ENV === 'development' ? error.details : undefined
            });
        }
    }
}

module.exports = new TransaksiController();
