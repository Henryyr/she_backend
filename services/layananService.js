const { pool } = require('../db');

exports.getAll = async () => {
    const [results] = await pool.query('SELECT * FROM layanan');
    return results;
};

exports.getById = async (id) => {
    const [results] = await pool.query('SELECT * FROM layanan WHERE id = ?', [id]);
    return results[0] || null;
};

exports.create = async ({ kategori_id, nama, harga, estimasi_waktu }) => {
    const sql = 'INSERT INTO layanan (kategori_id, nama, harga, estimasi_waktu) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(sql, [kategori_id, nama, harga, estimasi_waktu]);
    return result.insertId;
};

exports.update = async (id, { kategori_id, nama, harga, estimasi_waktu }) => {
    const sql = 'UPDATE layanan SET kategori_id = ?, nama = ?, harga = ?, estimasi_waktu = ? WHERE id = ?';
    const [result] = await pool.query(sql, [kategori_id, nama, harga, estimasi_waktu, id]);
    return result.affectedRows > 0;
};

exports.delete = async (id) => {
    const [result] = await pool.query('DELETE FROM layanan WHERE id = ?', [id]);
    return result.affectedRows > 0;
};
