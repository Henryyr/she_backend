const { pool } = require('../../db');

class TestimoniService {
    async getAllTestimoni() {
        try {
            const [rows] = await pool.query('SELECT * FROM testimoni ORDER BY created_at DESC');
            return rows;
        } catch (error) {
            console.error('Error getting testimonials:', error);
            throw error;
        }
    }

    async createTestimoni(data) {
        try {
            const [result] = await pool.query(
                'INSERT INTO testimoni (user_id, rating, komentar) VALUES (?, ?, ?)',
                [data.user_id, data.rating, data.komentar]
            );
            return result;
        } catch (error) {
            console.error('Error creating testimonial:', error);
            throw error;
        }
    }

    async getTestimoniById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM testimoni WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error getting testimonial by id:', error);
            throw error;
        }
    }

    async updateTestimoni(id, data) {
        try {
            const [result] = await pool.query(
                'UPDATE testimoni SET rating = ?, komentar = ? WHERE id = ?',
                [data.rating, data.komentar, id]
            );
            return result;
        } catch (error) {
            console.error('Error updating testimonial:', error);
            throw error;
        }
    }

    async deleteTestimoni(id) {
        try {
            const [result] = await pool.query('DELETE FROM testimoni WHERE id = ?', [id]);
            return result;
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            throw error;
        }
    }
}

module.exports = new TestimoniService();
