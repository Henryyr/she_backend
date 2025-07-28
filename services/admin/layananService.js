const { pool } = require('../../db');
const { flushCache } = require('../user/layananService'); // Import fungsi flushCache

const createLayanan = async (data) => {
  const { nama, harga, estimasi_waktu, kategori_id } = data;
  const [result] = await pool.query(
    'INSERT INTO layanan (nama, harga, estimasi_waktu, kategori_id) VALUES (?, ?, ?, ?)',
    [nama, harga, estimasi_waktu, kategori_id]
  );
  flushCache(); // Panggil fungsi untuk menghapus cache
  return { id: result.insertId, ...data };
};

const updateLayanan = async (id, data) => {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && ['nama', 'harga', 'estimasi_waktu', 'kategori_id'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return true;
  }

  values.push(id);

  const sql = `UPDATE layanan SET ${fields.join(', ')} WHERE id = ?`;

  const [result] = await pool.query(sql, values);
  flushCache(); // Panggil fungsi untuk menghapus cache
  return result.affectedRows > 0;
};

const deleteLayanan = async (id) => {
  const [result] = await pool.query('DELETE FROM layanan WHERE id = ?', [id]);
  flushCache(); // Panggil fungsi untuk menghapus cache
  return result.affectedRows > 0;
};

module.exports = {
  createLayanan,
  updateLayanan,
  deleteLayanan
};