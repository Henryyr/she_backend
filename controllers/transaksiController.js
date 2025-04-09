const TransaksiService = require('../services/transaksiService');

class TransaksiController {
    async createTransaction(req, res) {
        console.log('[TransaksiController] createTransaction called', req.body);
        try {
            const { booking_id, kategori_transaksi_id, is_dp } = req.body;
            const user_id = req.user.id;
            const result = await TransaksiService.createTransaction(booking_id, kategori_transaksi_id, is_dp, user_id);
            res.json(result);
        } catch (error) {
            console.error('[TransaksiController] createTransaction error:', error);
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async handleWebhook(req, res) {
        console.log('[TransaksiController] handleWebhook called', req.body);
        try {
            const result = await TransaksiService.handleWebhook(req.body);
            res.json(result);
        } catch (error) {
            console.error('[TransaksiController] handleWebhook error:', error);
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async payRemaining(req, res) {
        console.log('[TransaksiController] payRemaining called', req.body);
        try {
            const { transaksi_id } = req.body;
            const user_id = req.user.id;
            const result = await TransaksiService.payRemaining(transaksi_id, user_id);
            res.json(result);
        } catch (error) {
            console.error('[TransaksiController] payRemaining error:', error);
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async getUserTransactions(req, res) {
        console.log('[TransaksiController] getUserTransactions called', { user_id: req.user.id });
        try {
            const user_id = req.user.id;
            const transactions = await TransaksiService.getUserTransactions(user_id);
            res.json({ transactions });
        } catch (error) {
            console.error('[TransaksiController] getUserTransactions error:', error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = new TransaksiController();
