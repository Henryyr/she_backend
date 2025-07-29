const NodeCache = require('node-cache');

// Konfigurasi cache
const cacheConfig = {
  stdTTL: 300, // 5 menit default
  checkperiod: 600, // 10 menit
  useClones: false,
  deleteOnExpire: true
};

// Instance cache tunggal
const cache = new NodeCache(cacheConfig);

/**
 * Cache Manager untuk mengelola cache secara terpusat
 */
class CacheManager {
  /**
   * Mengambil data dari cache
   * @param {string} key - Kunci cache
   * @returns {*} Data dari cache atau null jika tidak ada
   */
  get (key) {
    return cache.get(key);
  }

  /**
   * Menyimpan data ke cache
   * @param {string} key - Kunci cache
   * @param {*} value - Data yang akan disimpan
   * @param {number} ttl - Time to live dalam detik (opsional)
   * @returns {boolean} True jika berhasil
   */
  set (key, value, ttl = null) {
    if (ttl) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  }

  /**
   * Menghapus data dari cache
   * @param {string} key - Kunci cache
   * @returns {number} Jumlah data yang dihapus
   */
  del (key) {
    return cache.del(key);
  }

  /**
   * Menghapus semua data cache
   */
  flush () {
    return cache.flushAll();
  }

  /**
   * Mengecek apakah key ada di cache
   * @param {string} key - Kunci cache
   * @returns {boolean} True jika ada
   */
  has (key) {
    return cache.has(key);
  }

  /**
   * Mengambil data dari cache atau mengambil dari fungsi jika tidak ada
   * @param {string} key - Kunci cache
   * @param {Function} fetchFunction - Fungsi untuk mengambil data jika tidak ada di cache
   * @param {number} ttl - Time to live dalam detik (opsional)
   * @returns {Promise<*>} Data dari cache atau hasil fetchFunction
   */
  async getOrSet (key, fetchFunction, ttl = null) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const data = await fetchFunction();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Mengambil statistik cache
   * @returns {Object} Statistik cache
   */
  getStats () {
    return cache.getStats();
  }

  /**
   * Mengambil semua keys yang ada di cache
   * @returns {string[]} Array of keys
   */
  getKeys () {
    return cache.keys();
  }

  /**
   * Menghapus cache berdasarkan pattern
   * @param {string} pattern - Pattern untuk mencari keys (regex)
   * @returns {number} Jumlah data yang dihapus
   */
  delPattern (pattern) {
    const keys = this.getKeys();
    const regex = new RegExp(pattern);
    const matchingKeys = keys.filter(key => regex.test(key));
    return cache.del(matchingKeys);
  }
}

// Export instance tunggal
module.exports = new CacheManager();
