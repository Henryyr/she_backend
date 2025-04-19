const TransaksiService = require('../services/transaksiService');
const transactionReceiptTemplate = require('../html/transactionReceipt');

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
        const tag = '[TransaksiController.getUserTransactions]';
        console.log(`${tag} started - user_id:`, req.user.id);
        try {
            const user_id = req.user.id;
            const transactions = await TransaksiService.getUserTransactions(user_id);
            console.log(`${tag} success - found ${transactions.length} transactions`);
            res.json({ transactions });
        } catch (error) {
            console.error(`${tag} error:`, {
                message: error.message,
                stack: error.stack,
                details: error.details || {}
            });
            res.status(error.status || 500).json({ 
                error: error.message || "Internal Server Error",
                details: process.env.NODE_ENV === 'development' ? error.details : undefined
            });
        }
    }

    async testQRCode(req, res) {
        try {
            console.log('[TransaksiController] testQRCode called');
            const testData = {
                booking_number: 'TEST-123',
                paymentStatus: 'paid',
                layanan_nama: 'Test Layanan',
                tanggal: new Date(),
                jam_mulai: '09:00',
                jam_selesai: '10:00',
                gross_amount: 100000,
                total_harga: 100000,
                newPaidAmount: 100000
            };

            const receipt = await transactionReceiptTemplate(testData);
            console.log('[TransaksiController] Receipt HTML generated');
            res.send(receipt);
        } catch (error) {
            console.error('[TransaksiController] Test QR Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TransaksiController();
