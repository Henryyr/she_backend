const voucherService = require('./voucherService');

/**
 * Service untuk menangani semua kalkulasi harga
 */
class PricingService {
  /**
   * Menghitung total harga dari layanan
   * @param {Array} layananWithCategory - Array layanan dengan kategori
   * @returns {number} Total harga layanan
   */
  calculateServicePrice (layananWithCategory) {
    return layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
  }

  /**
   * Menghitung harga produk tambahan
   * @param {Array} productResults - Hasil query produk
   * @returns {Object} { totalPrice, productDetail }
   */
  calculateProductPrice (productResults) {
    let totalPrice = 0;
    const productDetail = {};

    productResults.forEach((result) => {
      if (!result) throw new Error('Salah satu produk yang dipilih tidak ditemukan.');

      switch (result.type) {
        case 'hair_color':
          totalPrice += parseFloat(result.harga_dasar) + parseFloat(result.tambahan_harga);
          productDetail.hair_color = result;
          break;
        case 'smoothing':
          totalPrice += parseFloat(result.harga);
          productDetail.smoothing = result;
          break;
        case 'keratin':
          totalPrice += parseFloat(result.harga);
          productDetail.keratin = result;
          break;
      }
    });

    return { totalPrice, productDetail };
  }

  /**
   * Menghitung diskon voucher
   * @param {string} voucherCode - Kode voucher
   * @param {number} userId - ID user
   * @param {number} totalPrice - Total harga sebelum diskon
   * @returns {Object} { finalPrice, discount, voucherId, voucher }
   */
  async calculateVoucherDiscount (voucherCode, userId, totalPrice) {
    let finalPrice = totalPrice;
    let discount = 0;
    let voucherId = null;
    let voucher = { id: null, discount: 0, message: 'Tidak ada voucher yang diterapkan.' };

    if (!voucherCode) {
      return { finalPrice, discount, voucherId, voucher };
    }

    try {
      const finalVoucherResult = await voucherService.validateVoucher(voucherCode, userId, totalPrice);
      voucherId = finalVoucherResult.voucherId ? parseInt(finalVoucherResult.voucherId) : null;

      if (!voucherId) throw new Error('Voucher ID tidak valid.');

      if (finalVoucherResult.discount_type === 'percentage') {
        discount = (totalPrice * finalVoucherResult.discount_value) / 100;
      } else {
        discount = finalVoucherResult.discount_value;
      }

      finalPrice = Math.max(0, totalPrice - discount);
      voucher = {
        id: voucherId,
        discount: Math.round(discount),
        message: `Voucher "${voucherCode}" berhasil diterapkan.`
      };
    } catch (voucherError) {
      voucher.message = `Voucher "${voucherCode}" tidak valid: ${voucherError.message}.`;
    }

    return {
      finalPrice: Math.round(finalPrice),
      discount: Math.round(discount),
      voucherId,
      voucher
    };
  }

  /**
   * Menghitung total harga final
   * @param {Array} layananWithCategory - Array layanan
   * @param {Array} productResults - Hasil query produk
   * @param {string} voucherCode - Kode voucher
   * @param {number} userId - ID user
   * @returns {Object} { totalPrice, finalPrice, productDetail, voucher }
   */
  async calculateFinalPrice (layananWithCategory, productResults, voucherCode, userId) {
    // Hitung harga layanan
    const servicePrice = this.calculateServicePrice(layananWithCategory);

    // Hitung harga produk
    const { totalPrice: productPrice, productDetail } = this.calculateProductPrice(productResults);

    // Total harga sebelum diskon
    const totalPrice = servicePrice + productPrice;

    // Hitung diskon voucher
    const { finalPrice, discount, voucherId, voucher } = await this.calculateVoucherDiscount(
      voucherCode,
      userId,
      totalPrice
    );

    return {
      totalPrice,
      finalPrice,
      productDetail,
      voucher,
      voucherId,
      discount
    };
  }
}

module.exports = new PricingService();
