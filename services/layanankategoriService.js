const { pool } = require('../db');

class LayananKategoriService {
    async findAll() {
        const [results] = await pool.query('SELECT * FROM kategori_layanan');
        return results;
    }

    async findById(id) {
        const [results] = await pool.query('SELECT * FROM kategori_layanan WHERE id = ?', [id]);
        return results[0];
    }
}

module.exports = new LayananKategoriService();
