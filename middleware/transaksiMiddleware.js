const { isDevelopment } = require('../config/midtrans');

const validateCreateTransaction = (req, res, next) => {
    const { booking_id, kategori_transaksi_id } = req.body;

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
    if (kategori_transaksi_id === 1 && req.body.is_dp !== undefined) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran cash tidak menggunakan sistem DP"
        });
    }

    // For non-cash transactions (kategori_transaksi_id === 2), is_dp is always true (implicitly)
    if (kategori_transaksi_id === 2 && req.body.is_dp === false) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran non-cash hanya tersedia dengan sistem DP"
        });
    }

    // Set is_dp to true for non-cash transactions
    if (kategori_transaksi_id === 2) {
        req.body.is_dp = true;
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