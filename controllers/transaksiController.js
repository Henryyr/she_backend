const TransaksiService = require('../services/transaksiService');
const transactionReceiptTemplate = require('../html/transactionReceipt');

class TransaksiController {
    async getTransactionStatus(req, res) {
    try {
      const { order_id } = req.params;
      const user_id = req.user ? req.user.id : null;

      const result = await TransaksiService.getTransactionStatus(order_id, user_id);
      
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ 
        error: error.message || "Internal Server Error",
        details: process.env.NODE_ENV === 'development' ? error.details : undefined
      });
    }
  }
  
    async createTransaction(req, res) {
        try {
            const { booking_id, kategori_transaksi_id, is_dp } = req.body;
            const user_id = req.user.id;
            
            const result = await TransaksiService.createTransaction(booking_id, kategori_transaksi_id, is_dp, user_id);
            
            // Tambahkan pesan khusus jika DP diprioritaskan
            let responseMessage = result;
            
            if (req.dpPrioritized) {
                responseMessage = {
                    ...result,
                    priority_message: "Sistem merekomendasikan pembayaran DP untuk kemudahan transaksi",
                    payment_method: "DP (Down Payment)",
                    note: "Pembayaran DP diprioritaskan untuk pengalaman yang lebih baik"
                };
            }
            
            if (req.dpDefaulted) {
                responseMessage = {
                    ...result,
                    default_message: "Metode pembayaran default: DP (Down Payment)",
                    payment_method: "DP (Down Payment)"
                };
            }
            
            if (req.cashWarning) {
                responseMessage = {
                    ...result,
                    warning_message: "Pembayaran cash dipilih. Untuk kemudahan, pertimbangkan menggunakan DP",
                    payment_method: "Cash",
                    recommendation: "Sistem merekomendasikan DP untuk fleksibilitas pembayaran"
                };
            }
            
            res.json(responseMessage);
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