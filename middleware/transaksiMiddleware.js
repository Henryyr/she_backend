const { isDevelopment } = require('../config/midtrans');

const validateCreateTransaction = (req, res, next) => {
  const { booking_id, kategori_transaksi_id, is_dp } = req.body;

  if (isDevelopment || req.headers['x-test-mode'] === 'true') {
    return next();
  }

  if (!booking_id || !kategori_transaksi_id) {
    return res.status(400).json({
      error: 'Data tidak lengkap',
      details: 'booking_id dan kategori_transaksi_id harus diisi'
    });
  }

  // Pembayaran cash (ID 1) tidak boleh menggunakan DP
  if (kategori_transaksi_id === 1 && typeof is_dp !== 'undefined') {
    return res.status(400).json({
      error: 'Format tidak valid',
      details: 'Pembayaran tunai tidak mendukung sistem DP.'
    });
  }

  // Pembayaran non-tunai (ID 2) harus DP (untuk saat ini)
  if (kategori_transaksi_id === 2 && is_dp === false) {
    return res.status(400).json({
      error: 'Format tidak valid',
      details: 'Saat ini pembayaran online hanya tersedia dengan metode DP.'
    });
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
      error: 'Data tidak lengkap',
      details: 'transaksi_id harus diisi'
    });
  }

  next();
};

module.exports = {
  validateCreateTransaction,
  validatePayRemaining
};
