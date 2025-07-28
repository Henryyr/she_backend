const { pool } = require('../../db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache 1 jam

exports.getAll = async () => {
  const cacheKey = 'daftar_layanan';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const [results] = await pool.query('SELECT * FROM layanan');
  cache.set(cacheKey, results);
  return results;
};

exports.getById = async (id) => {
  const [results] = await pool.query('SELECT * FROM layanan WHERE id = ?', [id]);
  return results[0] || null;
};

// Tambahkan baris ini untuk mengekspor objek cache
exports.cache = cache;