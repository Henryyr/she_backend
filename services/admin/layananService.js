const { pool } = require('../../db');

const createLayanan = async (data) => {
    const { nama, harga, estimasi_waktu, kategori_id } = data;
    const [result] = await pool.query(
        'INSERT INTO layanan (nama, harga, estimasi_waktu, kategori_id) VALUES (?, ?, ?, ?)',
        [nama, harga, estimasi_waktu, kategori_id]
    );
    return { id: result.insertId, ...data };
};

const updateLayanan = async (id, data) => {
    const fields = [];
    const values = [];

    // Loop melalui data yang dikirim dan buat query secara dinamis
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && ['nama', 'harga', 'estimasi_waktu', 'kategori_id'].includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    // Jika tidak ada field yang dikirim untuk diupdate, jangan lakukan apa-apa
    if (fields.length === 0) {
        return true; // atau false jika Anda ingin menandakan tidak ada perubahan
    }

    // Tambahkan ID ke akhir array values untuk klausa WHERE
    values.push(id);

    const sql = `UPDATE layanan SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
};

const deleteLayanan = async (id) => {
    const [result] = await pool.query('DELETE FROM layanan WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    createLayanan,
    updateLayanan,
    deleteLayanan,
};