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

    if (typeof is_dp !== 'boolean') {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "is_dp harus berupa boolean"
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
