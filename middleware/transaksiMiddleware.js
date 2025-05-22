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

    // PRIORITAS DP: Otomatis set ke DP (kategori 2) jika tidak dispecified
    // atau jika user mencoba memilih cash tapi sistem prefer DP
    if (!kategori_transaksi_id || kategori_transaksi_id === 1) {
        // Berikan warning bahwa sistem merekomendasikan DP
        req.body.kategori_transaksi_id = 2; // Force ke DP
        req.body.is_dp = true;
        req.dpPrioritized = true; // Flag untuk response message
    }

    // For cash transactions (kategori_transaksi_id === 1), is_dp should not be present
    if (req.body.kategori_transaksi_id === 1 && req.body.is_dp !== undefined) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran cash tidak menggunakan sistem DP"
        });
    }

    // For non-cash transactions (kategori_transaksi_id === 2), is_dp is always true (implicitly)
    if (req.body.kategori_transaksi_id === 2 && req.body.is_dp === false) {
        return res.status(400).json({
            error: "Format tidak valid",
            details: "Pembayaran non-cash hanya tersedia dengan sistem DP"
        });
    }

    // Set is_dp to true for non-cash transactions
    if (req.body.kategori_transaksi_id === 2) {
        req.body.is_dp = true;
    }

    next();
};

// Middleware khusus untuk memberikan opsi DP terlebih dahulu
const prioritizeDP = (req, res, next) => {
    // Jika tidak ada kategori transaksi yang dipilih, default ke DP
    if (!req.body.kategori_transaksi_id) {
        req.body.kategori_transaksi_id = 2; // DP
        req.body.is_dp = true;
        req.dpDefaulted = true;
    }
    
    // Jika user memilih cash, berikan warning recommendation
    if (req.body.kategori_transaksi_id === 1) {
        req.cashWarning = true;
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
    validatePayRemaining,
    prioritizeDP
};