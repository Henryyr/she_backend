const { pool } = require('../../db');

exports.getAll = async () => {
    const [results] = await pool.query('SELECT * FROM layanan');
    return results;
};

exports.getById = async (id) => {
    const [results] = await pool.query('SELECT * FROM layanan WHERE id = ?', [id]);
    return results[0] || null;
};
