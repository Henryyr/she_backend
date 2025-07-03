const { pool } = require('../../db');

const getAllKategoriLayanan = async () => {
    const [rows] = await pool.query('SELECT * FROM kategori_layanan ORDER BY nama');
    return rows;
};

module.exports = {
    getAllKategoriLayanan,
};