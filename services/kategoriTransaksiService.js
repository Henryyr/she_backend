const db = require('../db');

const getAllKategoriTransaksi = async () => {
    const [results] = await db.promise().query(
        `SELECT id, nama FROM kategori_transaksi ORDER BY id ASC`
    );
    return results;
};

module.exports = {
    getAllKategoriTransaksi
};
