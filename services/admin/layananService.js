const { pool } = require('../../db');
const cacheManager = require('../../utils/cacheManager');

const createLayanan = async (data) => {
  const { nama, harga, estimasi_waktu, kategori_id } = data;
  const [result] = await pool.query(
    'INSERT INTO layanan (nama, harga, estimasi_waktu, kategori_id) VALUES (?, ?, ?, ?)',
    [nama, harga, estimasi_waktu, kategori_id]
  );

  // Hapus cache setelah membuat layanan baru
  flushCache();

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

  // Hapus cache setelah update
  flushCache(id);

  return result.affectedRows > 0;
};

const deleteLayanan = async (id) => {
  const [result] = await pool.query('DELETE FROM layanan WHERE id = ?', [id]);

  // Hapus cache setelah delete
  flushCache(id);

  return result.affectedRows > 0;
};

// Fungsi untuk menghapus cache layanan
const flushCache = (id = null) => {
  if (id) {
    cacheManager.del(`layanan_${id}`);
  } else {
    cacheManager.del('daftar_layanan');
    cacheManager.delPattern('^layanan_');
  }
};

module.exports = {
  createLayanan,
  updateLayanan,
  deleteLayanan
};
