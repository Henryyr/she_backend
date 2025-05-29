const { pool } = require('../../db');

const getAllKategoriTransaksi = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM kategori_transaksi ORDER BY nama');
        return rows;
    } catch (error) {
        console.error('Error getting kategori transaksi:', error);
        throw new Error('Failed to get kategori transaksi');
    }
};

module.exports = {
    getAllKategoriTransaksi
};
