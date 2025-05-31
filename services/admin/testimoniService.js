const { pool } = require('../../db');

class AdminTestimoniService {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM testimoni ORDER BY created_at DESC');
        return rows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM testimoni WHERE id = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Not Found');
        return result;
    }

    async updateStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE testimoni SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0) throw new Error('Not Found');
        return result;
    }
}

module.exports = new AdminTestimoniService();
