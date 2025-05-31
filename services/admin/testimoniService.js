const { pool } = require('../../db');

const getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM testimoni ORDER BY created_at DESC');
    return rows;
};

const deleteTestimoni = async (id) => {
    const [result] = await pool.query('DELETE FROM testimoni WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new Error('Not Found');
    return result;
};

const updateStatus = async (id, status) => {
    const [result] = await pool.query(
        'UPDATE testimoni SET status = ? WHERE id = ?',
        [status, id]
    );
    if (result.affectedRows === 0) throw new Error('Not Found');
    return result;
};

module.exports = {
    getAll,
    delete: deleteTestimoni,
    updateStatus
};
