const bookingValidationHelper = require('../../helpers/bookingValidationHelper');
const { RATE_LIMIT } = require('../../config/rateLimit');

/**
 * Service untuk menangani semua validasi
 */
class ValidationService {
  /**
   * Validasi rate limit booking
   * @param {number} userId - ID user
   * @param {Object} connection - Database connection
   * @returns {Promise<void>}
   */
  async validateRateLimit (userId, connection) {
    const [rateLimitResult] = await connection.query(
      'SELECT COUNT(*) as count FROM booking WHERE user_id = ? AND created_at > NOW() - INTERVAL ? MINUTE',
      [userId, process.env.NODE_ENV === 'production' ? 60 : 5]
    );

    if (rateLimitResult[0].count >= RATE_LIMIT.DATABASE.MAX_REQUESTS) {
      throw new Error('Rate limit terlampaui. Silakan coba lagi nanti.');
    }
  }

  /**
   * Validasi booking yang sudah ada
   * @param {number} userId - ID user
   * @param {string} tanggal - Tanggal booking
   * @param {Object} connection - Database connection
   * @returns {Promise<void>}
   */
  async validateExistingBooking (userId, tanggal, connection) {
    const [existingBookings] = await connection.query(
      'SELECT id FROM booking WHERE user_id = ? AND tanggal = ? AND status NOT IN (\'cancelled\', \'completed\')',
      [userId, tanggal]
    );

    if (existingBookings.length > 0) {
      throw new Error('Anda sudah memiliki booking pada hari ini.');
    }
  }

  /**
   * Validasi layanan yang dipilih
   * @param {Array} layananIds - Array ID layanan
   * @param {Array} layananWithCategory - Array layanan dengan kategori
   * @returns {Promise<void>}
   */
  validateServices (layananIds, layananWithCategory) {
    if (layananWithCategory.length !== layananIds.length) {
      throw new Error('Beberapa layanan tidak valid.');
    }
  }

  /**
   * Validasi kompatibilitas layanan dan produk
   * @param {Array} layananWithCategory - Array layanan dengan kategori
   * @param {Object} hairColor - Data hair color
   * @param {Object} smoothingProduct - Data smoothing product
   * @param {Object} keratinProduct - Data keratin product
   * @returns {Promise<void>}
   */
  validateServiceCompatibility (layananWithCategory, hairColor, smoothingProduct, keratinProduct) {
    const categories = layananWithCategory.map((l) => l.kategori_nama);

    // Validasi produk yang tidak diperlukan
    bookingValidationHelper.isProductUnnecessary(categories, hairColor, smoothingProduct, keratinProduct);

    // Validasi kombinasi yang tidak kompatibel
    if (bookingValidationHelper.isIncompatibleCombo(categories) || bookingValidationHelper.hasDuplicateCategory(categories)) {
      throw new Error('Kombinasi layanan atau duplikasi kategori tidak diperbolehkan.');
    }

    // Validasi produk yang diperlukan
    if (categories.includes('Cat Rambut') && !hairColor) {
      throw new Error('Layanan Cat Rambut membutuhkan pemilihan warna.');
    }
  }

  /**
   * Validasi stok produk
   * @param {Object} hairColor - Data hair color
   * @param {Object} smoothingProduct - Data smoothing product
   * @param {Object} keratinProduct - Data keratin product
   * @param {Object} connection - Database connection
   * @returns {Promise<void>}
   */
  async validateStock (hairColor, smoothingProduct, keratinProduct, connection) {
    if (hairColor) {
      const [stockResult] = await connection.query(
        'SELECT stok FROM hair_colors WHERE id = ? FOR UPDATE',
        [hairColor.color_id]
      );
      if (!stockResult[0] || stockResult[0].stok < 1) {
        throw new Error('Stok warna tidak mencukupi');
      }
    }

    if (smoothingProduct) {
      const [stockResult] = await connection.query(
        'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ? FOR UPDATE',
        [smoothingProduct.product_id, smoothingProduct.brand_id]
      );
      if (!stockResult[0] || stockResult[0].stok < 1) {
        throw new Error('Stok smoothing tidak mencukupi');
      }
    }

    if (keratinProduct) {
      const [stockResult] = await connection.query(
        'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ? FOR UPDATE',
        [keratinProduct.product_id, keratinProduct.brand_id]
      );
      if (!stockResult[0] || stockResult[0].stok < 1) {
        throw new Error('Stok keratin tidak mencukupi');
      }
    }
  }

  /**
   * Validasi data booking secara lengkap
   * @param {Object} data - Data booking
   * @param {Object} connection - Database connection
   * @returns {Promise<Object>} Data yang sudah divalidasi
   */
  async validateBookingData (data, connection) {
    const { user_id, layanan_id, tanggal, hair_color, smoothing_product, keratin_product } = data;
    const layanan_ids = Array.isArray(layanan_id) ? layanan_id : [layanan_id];

    // Validasi rate limit
    await this.validateRateLimit(user_id, connection);

    // Validasi booking yang sudah ada
    await this.validateExistingBooking(user_id, tanggal, connection);

    // Ambil data layanan
    const [layananWithCategory] = await connection.query(
      'SELECT l.*, lk.nama as kategori_nama FROM layanan l JOIN kategori_layanan lk ON l.kategori_id = lk.id WHERE l.id IN (?)',
      [layanan_ids]
    );

    // Validasi layanan
    this.validateServices(layanan_ids, layananWithCategory);

    // Validasi kompatibilitas
    this.validateServiceCompatibility(layananWithCategory, hair_color, smoothing_product, keratin_product);

    return { layananWithCategory };
  }
}

module.exports = new ValidationService();
