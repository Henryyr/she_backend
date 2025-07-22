// middleware/errorHandler.js

/**
 * Global Error Handler untuk menangani semua error yang terjadi di aplikasi.
 * Memberikan respons yang konsisten dan user-friendly.
 */
const errorHandler = (err, req, res, next) => {
  // Mencatat error di server untuk kebutuhan debugging.
  // Di lingkungan produksi, Anda mungkin ingin menggunakan logger yang lebih canggih.
  console.error(`[GLOBAL ERROR] Path: ${req.path} | Error:`, err);

  // Default status dan pesan error jika tidak ada yang spesifik
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server, silakan coba lagi nanti.';
  let details = err.details;

  // --- Penanganan Error Spesifik ---

  // 1. Error karena format JSON tidak valid (dari body-parser)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400; // Bad Request
    message = 'Format JSON yang dikirim tidak valid. Mohon periksa kembali request body Anda.';
    details = 'Pastikan Anda mengirim JSON dengan format yang benar, termasuk tanda kurung, koma, dan kutip yang sesuai.';
  }

  // 2. Error dari Rate Limiter
  if (err.statusCode === 429) {
    statusCode = 429;
    message = 'Terlalu banyak permintaan dari Anda. Mohon coba lagi setelah beberapa saat.';
  }

  // 3. Error karena validasi (misalnya dari library validasi atau buatan sendiri)
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    message = 'Data yang dikirim tidak valid.';
    details = err.message; // Pesan detail dari error validasi
  }

  // Jika headers respons sudah dikirim, biarkan Express yang menangani.
  if (res.headersSent) {
    return next(err);
  }

  // Di lingkungan produksi, sembunyikan detail teknis yang tidak perlu
  if (process.env.NODE_ENV === 'production') {
    res.removeHeader('X-Powered-By'); // Praktik keamanan
    // Jika bukan error yang disengaja (bukan 4xx), berikan pesan generik
    if (statusCode >= 500) {
      message = 'Terjadi kesalahan internal pada server.';
      details = undefined; // Sembunyikan detail di produksi
    }
  }

  // Kirim respons error yang terstruktur
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: {
      message,
      // Hanya tampilkan detail jika ada dan bukan di produksi untuk error 500
      ...(details && { details }),
      // Tampilkan stack trace hanya di development mode
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
