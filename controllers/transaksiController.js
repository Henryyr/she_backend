const TransaksiService = require('../services/transaksiService');
const transactionReceiptTemplate = require('../html/transactionReceipt');

class TransaksiController {
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

    // Method baru untuk mendapatkan opsi pembayaran dengan prioritas DP
    async getPaymentOptions(req, res) {
        try {
            const paymentOptions = [
                {
                    id: 2,
                    name: "DP (Down Payment)",
                    description: "Bayar sebagian sekarang, sisanya nanti",
                    priority: 1,
                    recommended: true,
                    benefits: [
                        "Fleksibilitas pembayaran",
                        "Booking terjamin",
                        "Bisa bayar sisanya saat treatment"
                    ]
                },
                {
                    id: 1,
                    name: "Cash (Tunai Penuh)",
                    description: "Bayar penuh sekarang",
                    priority: 2,
                    recommended: false,
                    benefits: [
                        "Selesai dalam 1x pembayaran",
                        "Tidak ada sisa pembayaran"
                    ]
                }
            ];

            res.json({
                payment_options: paymentOptions,
                default_option: paymentOptions[0], // DP as default
                message: "DP (Down Payment) direkomendasikan untuk kemudahan transaksi"
            });
        } catch (error) {
            res.status(500).json({ 
                error: error.message || "Internal Server Error" 
            });
        }
    }
}

module.exports = new TransaksiController();