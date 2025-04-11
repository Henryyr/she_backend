const db = require('../db');
const { promisify } = require('util');

const query = promisify(db.query).bind(db);

class TestimoniService {
    static async create(data) {
        const { user_id, rating, comment, image_url } = data;
        
        // Validasi rating
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new Error("Rating harus berupa angka 1-5");
        }

        const bookingSql = `
            SELECT b.id as booking_id, bl.layanan_id
            FROM booking b
            JOIN booking_layanan bl ON b.id = bl.booking_id
            WHERE b.user_id = ? 
            AND b.status = 'completed' 
            AND b.id NOT IN (SELECT booking_id FROM testimoni WHERE user_id = ?)
            ORDER BY b.completed_at DESC LIMIT 1`;
        
        const booking = await query(bookingSql, [user_id, user_id]);
        if (!booking.length) {
            throw new Error("Tidak ditemukan treatment yang sudah selesai");
        }

        if (!rating || !comment) {
            throw new Error("Rating dan komentar wajib diisi");
        }
        
        const sql = `INSERT INTO testimoni 
            (user_id, layanan_id, booking_id, rating, comment, image_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
        return await query(sql, [
            user_id, 
            booking[0].layanan_id,
            booking[0].booking_id,
            ratingNum,  // Gunakan ratingNum yang sudah divalidasi
            comment, 
            image_url
        ]);
    }

    static async getPublic() {
        const sql = `
            SELECT t.id, u.username, l.nama as layanan_nama, 
                   t.rating, t.comment, t.created_at, t.image_url
            FROM testimoni t
            JOIN users u ON t.user_id = u.id
            JOIN layanan l ON t.layanan_id = l.id
            WHERE t.status = 'approved'
            ORDER BY t.created_at DESC
        `;
        return await query(sql);
    }

    static async getAll() {
        const sql = `
            SELECT t.id, u.username, l.nama as layanan_nama, t.rating, t.comment, t.created_at
            FROM testimoni t
            JOIN users u ON t.user_id = u.id
            JOIN layanan l ON t.layanan_id = l.id
            ORDER BY t.created_at DESC
        `;
        return await query(sql);
    }

    static async delete(id) {
        const sql = `DELETE FROM testimoni WHERE id = ?`;
        const result = await query(sql, [id]);
        if (result.affectedRows === 0) {
            throw new Error('Not Found');
        }
        return result;
    }

    static async approve(id, is_public = true) {
        const sql = `
            UPDATE testimoni 
            SET is_approved = true, is_public = ?
            WHERE id = ?`;
        const result = await query(sql, [is_public, id]);
        if (result.affectedRows === 0) {
            throw new Error('Testimoni tidak ditemukan');
        }
        return result;
    }

    static async updateStatus(id, status) {
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            throw new Error('Status tidak valid');
        }

        const sql = `UPDATE testimoni SET status = ? WHERE id = ?`;
        const result = await query(sql, [status, id]);
        if (result.affectedRows === 0) {
            throw new Error('Testimoni tidak ditemukan');
        }
        return result;
    }
}

module.exports = TestimoniService;
