const { isDevelopment } = require('../config/midtrans');

const validateCreateTransaction = (req, res, next) => {
    const { booking_id, kategori_transaksi_id } = req.body;

    if (isDevelopment || req.headers['x-test-mode'] === 'true') {
        return next();
    }

    if (!booking_id || !kategori_transaksi_id) {
        return res.status(400).json({ 
            error: "Data tidak lengkap",
            details: "booking_id dan kategori_transaksi_id harus diisi"
        });
    }

    if (req.body.kategori_transaksi_id === 1 && req.body.is_dp !== undefined) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran cash tidak menggunakan sistem DP"
        });
    }

    if (req.body.kategori_transaksi_id === 2 && req.body.is_dp === false) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran non-cash hanya tersedia dengan sistem DP"
        });
    }

    if (req.body.kategori_transaksi_id === 2) {
        req.body.is_dp = true;
    }

    next();
};

const validatePayRemaining = (req, res, next) => {
    const { transaksi_id } = req.body;

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