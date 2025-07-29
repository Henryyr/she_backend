const { pool } = require('../../db');
const cacheManager = require('../../utils/cacheManager');

exports.getAll = async () => {
  const cacheKey = 'daftar_layanan';

  return await cacheManager.getOrSet(cacheKey, async () => {
    const [results] = await pool.query('SELECT * FROM layanan');
    return results;
  }, 3600); // Cache 1 jam
};

exports.getById = async (id) => {
  const cacheKey = `layanan_${id}`;

  return await cacheManager.getOrSet(cacheKey, async () => {
    const [results] = await pool.query('SELECT * FROM layanan WHERE id = ?', [id]);
    return results[0] || null;
  }, 1800); // Cache 30 menit
};

// Fungsi untuk menghapus cache layanan
exports.flushCache = (id = null) => {
  if (id) {
    cacheManager.del(`layanan_${id}`);
  } else {
    cacheManager.del('daftar_layanan');
    cacheManager.delPattern('^layanan_');
  }
};
