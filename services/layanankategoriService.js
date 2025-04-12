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

    async create(nama) {
        const [result] = await pool.query('INSERT INTO kategori_layanan (nama) VALUES (?)', [nama]);
        return result.insertId;
    }

    async update(id, nama) {
        const [result] = await pool.query('UPDATE kategori_layanan SET nama = ? WHERE id = ?', [nama, id]);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM kategori_layanan WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new LayananKategoriService();
