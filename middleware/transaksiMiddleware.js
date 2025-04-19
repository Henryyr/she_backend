const { isDevelopment } = require('../config/midtrans');

const validateCreateTransaction = (req, res, next) => {
    const { booking_id, kategori_transaksi_id, is_dp } = req.body;

    // Skip validasi jika dalam mode development atau testing
    if (isDevelopment || req.headers['x-test-mode'] === 'true') {
        return next();
    }

    if (!booking_id || !kategori_transaksi_id) {
        return res.status(400).json({ 
            error: "Data tidak lengkap",
            details: "booking_id dan kategori_transaksi_id harus diisi"
        });
    }

    // For cash transactions (kategori_transaksi_id === 1), is_dp should not be present
    if (kategori_transaksi_id === 1 && is_dp !== undefined) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran cash tidak menggunakan sistem DP"
        });
    }

    // For non-cash transactions (kategori_transaksi_id === 2), is_dp must be boolean
    if (kategori_transaksi_id === 2 && typeof is_dp !== 'boolean') {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "is_dp harus berupa boolean untuk pembayaran non-cash"
        });
    }

    next();
};

const validatePayRemaining = (req, res, next) => {
    const { transaksi_id } = req.body;

    // Skip validasi jika dalam mode development atau testing
    if (isDevelopment || req.headers['x-test-mode'] === 'true') {
        return next();
    }

    if (!transaksi_id) {
        return res.status(400).json({
            error: "Data tidak lengkap",
            details: "transaksi_id harus diisi"
        });
    }

    next();
};

module.exports = {
    validateCreateTransaction,
    validatePayRemaining
};
