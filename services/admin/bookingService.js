const { pool } = require('../../db');
const paginateQuery = require('../../helpers/paginateQuery');

const getAllBookings = async (page = 1, limit = 10) => {
    const sql = `
        SELECT 
            b.id,
            u.fullname as customer,
            DATE_FORMAT(b.tanggal, '%d %b %Y') as date,
            TIME_FORMAT(b.jam_mulai, '%H:%i') as start_time,
            TIME_FORMAT(b.jam_selesai, '%H:%i') as end_time,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as services,
            b.status
        FROM booking b
        JOIN users u ON b.user_id = u.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        GROUP BY b.id
        ORDER BY b.created_at DESC
    `;
    const countSql = `SELECT COUNT(DISTINCT b.id) as total FROM booking b`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [], [], page, limit);
    return { bookings: data, pagination };
};

const getBookingsByUserId = async (userId, page = 1, limit = 10) => {
    const sql = `
        SELECT 
            b.id,
            u.fullname as customer,
            DATE_FORMAT(b.tanggal, '%d %b %Y') as date,
            TIME_FORMAT(b.jam_mulai, '%H:%i') as start_time,
            TIME_FORMAT(b.jam_selesai, '%H:%i') as end_time,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as services,
            b.status
        FROM booking b
        JOIN users u ON b.user_id = u.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        WHERE b.user_id = ?
        GROUP BY b.id
        ORDER BY b.created_at DESC
    `;
    const countSql = `SELECT COUNT(DISTINCT b.id) as total FROM booking b WHERE b.user_id = ?`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [userId], [userId], page, limit);
    return { bookings: data, pagination };
};

const getBookingById = async (id) => {
    try {
        const [bookings] = await pool.query(`
            SELECT 
                b.*,
                u.fullname as customer_name,
                u.phone_number as customer_phone,
                u.email as customer_email,
                GROUP_CONCAT(DISTINCT l.nama SEPARATOR ', ') as services,
                GROUP_CONCAT(DISTINCT l.id) as service_ids
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            LEFT JOIN booking_colors bc ON b.id = bc.booking_id
            LEFT JOIN hair_colors hc ON bc.color_id = hc.id
            LEFT JOIN hair_products hp ON hc.product_id = hp.id
            LEFT JOIN product_brands pb ON hp.brand_id = pb.id
            WHERE b.id = ?
            GROUP BY b.id
        `, [id]);

        if (bookings.length === 0) {
            return null;
        }

        const booking = bookings[0];

        // Get product details if any
        const [productDetails] = await pool.query(`
            SELECT 
                'hair_color' as type,
                hc.id as color_id,
                hc.nama as color_name,
                pb.nama as brand_name,
                hp.harga_dasar,
                hc.tambahan_harga
            FROM booking_colors bc
            JOIN hair_colors hc ON bc.color_id = hc.id
            JOIN hair_products hp ON hc.product_id = hp.id
            JOIN product_brands pb ON hp.brand_id = pb.id
            WHERE bc.booking_id = ?
        `, [id]);

        if (productDetails.length > 0) {
            booking.products = productDetails;
        }

        return booking;
    } catch (error) {
        console.error('Error fetching booking details:', error);
        throw new Error(`Failed to retrieve booking: ${error.message}`);
    }
};

const updateBooking = async (id, data) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { tanggal, jam_mulai, jam_selesai, status, special_request } = data;
        
        // First check if booking exists
        const [booking] = await connection.query(
            'SELECT * FROM booking WHERE id = ?',
            [id]
        );

        if (booking.length === 0) {
            return null;
        }

        // Update basic booking information
        await connection.query(
            `UPDATE booking 
             SET tanggal = COALESCE(?, tanggal),
                 jam_mulai = COALESCE(?, jam_mulai),
                 jam_selesai = COALESCE(?, jam_selesai),
                 status = COALESCE(?, status),
                 special_request = COALESCE(?, special_request),
                 updated_at = NOW()
             WHERE id = ?`,
            [tanggal, jam_mulai, jam_selesai, status, special_request, id]
        );

        // If service IDs have been provided, update them
        if (data.service_ids && Array.isArray(data.service_ids)) {
            // Delete existing service relations
            await connection.query(
                'DELETE FROM booking_layanan WHERE booking_id = ?',
                [id]
            );

            // Insert new service relations
            for (const serviceId of data.service_ids) {
                await connection.query(
                    'INSERT INTO booking_layanan (booking_id, layanan_id) VALUES (?, ?)',
                    [id, serviceId]
                );
            }
        }

        await connection.commit();

        // Get the updated booking
        const updatedBooking = await getBookingById(id);
        return updatedBooking;

    } catch (error) {
        await connection.rollback();
        console.error('Error updating booking:', error);
        throw new Error(`Failed to update booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const deleteBooking = async (id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if booking exists
        const [booking] = await connection.query(
            'SELECT * FROM booking WHERE id = ?',
            [id]
        );

        if (booking.length === 0) {
            return null;
        }

        // Delete related records first
        await connection.query('DELETE FROM booking_layanan WHERE booking_id = ?', [id]);
        await connection.query('DELETE FROM booking_colors WHERE booking_id = ?', [id]);
        
        // Delete the booking itself
        await connection.query('DELETE FROM booking WHERE id = ?', [id]);

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting booking:', error);
        throw new Error(`Failed to delete booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const updateBookingStatus = async (id, status) => {
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new Error('Status tidak valid');
    }
    // Hapus updated_at = NOW() jika kolom updated_at tidak ada
    const [result] = await pool.query(
        'UPDATE booking SET status = ? WHERE id = ?',
        [status, id]
    );
    if (result.affectedRows === 0) {
        return null;
    }
    return { id, status };
};

module.exports = {
    getAllBookings,
    getBookingsByUserId,
    getBookingById,
    updateBooking,
    deleteBooking,
    updateBookingStatus
};
