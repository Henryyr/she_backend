const { pool } = require('../../db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache 1 jam

class LayananKategoriService {
    async findAll() {
        const cacheKey = 'layanan_kategori_all';
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
        const [results] = await pool.query('SELECT * FROM kategori_layanan');
        cache.set(cacheKey, results);
        return results;
    }

    async findById(id) {
        const [results] = await pool.query('SELECT * FROM kategori_layanan WHERE id = ?', [id]);
        return results[0];
    }
}

module.exports = new LayananKategoriService();
