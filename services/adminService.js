const { pool } = require('../db');
const paginateQuery = require('../helpers/paginateQuery');

const getAllUsers = async (page = 1, limit = 10) => {
    const sql = `
        SELECT id, fullname, email, phone_number, username, address, role 
        FROM users
        ORDER BY created_at DESC
    `;
    const countSql = `SELECT COUNT(*) as total FROM users`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [], [], page, limit);
    return { users: data, pagination };
};

const updateUser = async (id, data) => {
    const { fullname, email, phone_number, username, address, role } = data;
    const sql = "UPDATE users SET fullname = ?, email = ?, phone_number = ?, username = ?, address = ?, role = ? WHERE id = ?";
    const [result] = await pool.query(sql, [fullname, email, phone_number, username, address, role, id]);
    return result.affectedRows > 0;
};

const deleteUser = async (id) => {
    const sql = "DELETE FROM users WHERE id = ?";
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
};

const getRecentTransactions = async (limit = 5) => {
    const [transactions] = await pool.query(`
        SELECT 
            t.id,
            u.fullname as name,
            DATE_FORMAT(t.created_at, '%d %b %Y') as date,
            CASE 
                WHEN t.status = 'completed' THEN 'Completed'
                WHEN t.status = 'pending' THEN 'Pending'
                ELSE CONCAT(UPPER(LEFT(t.status, 1)), LOWER(SUBSTRING(t.status, 2)))
            END as status
        FROM transaksi t
        JOIN users u ON t.user_id = u.id
        WHERE t.status NOT IN ('expired', 'cancelled', 'failed')
        ORDER BY t.created_at DESC
        LIMIT ?
    `, [limit]);
    return transactions;
};

const getAllTransactions = async (page = 1, limit = 10) => {
    const sql = `
        SELECT 
            t.id,
            u.fullname as name,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as keterangan,
            CONCAT(
                DATE_FORMAT(b.tanggal, '%d %b %Y'), ' - ',
                TIME_FORMAT(b.jam_mulai, '%H:%i'), ' WIB'
            ) as date_time,
            k.nama as type,
            CASE 
                WHEN t.status = 'completed' THEN 'Completed'
                WHEN t.status = 'pending' THEN 'Pending'
                ELSE CONCAT(UPPER(LEFT(t.status, 1)), LOWER(SUBSTRING(t.status, 2)))
            END as status
        FROM transaksi t
        JOIN users u ON t.user_id = u.id
        JOIN booking b ON t.booking_id = b.id
        JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        GROUP BY t.id
        ORDER BY t.created_at DESC
    `;
    const countSql = `SELECT COUNT(DISTINCT t.id) as total FROM transaksi t`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [], [], page, limit);
    return { transactions: data, pagination };
};

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

const getTransactionsByUserId = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
        db.transaction.findMany({
            where: { userId },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        db.transaction.count({ where: { userId } })
    ]);

    const totalPages = Math.ceil(countResult / limit);

    return {
        data: rows,
        pagination: {
            totalItems: countResult,
            totalPages,
            currentPage: page,
            perPage: limit
        }
    };
};

// New Admin Booking CRUD Methods

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
    try {
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error('Status tidak valid');
        }

        const [result] = await pool.query(
            'UPDATE booking SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return { id, status };
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw new Error(`Failed to update booking status: ${error.message}`);
    }
};

const completeBooking = async (id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get booking details with product information
        const [bookingDetails] = await connection.query(`
            SELECT b.*, 
                   bc.color_id, bc.brand_id as color_brand_id,
                   bs.product_id as smoothing_id, bs.brand_id as smoothing_brand_id,
                   bk.product_id as keratin_id, bk.brand_id as keratin_brand_id
            FROM booking b
            LEFT JOIN booking_colors bc ON b.id = bc.booking_id
            LEFT JOIN booking_smoothing bs ON b.id = bs.booking_id
            LEFT JOIN booking_keratin bk ON b.id = bk.booking_id
            WHERE b.id = ? FOR UPDATE`,
            [id]
        );

        if (bookingDetails.length === 0) {
            return null;
        }

        const booking = bookingDetails[0];

        if (booking.status === 'completed') {
            throw new Error('Booking sudah selesai');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Tidak dapat menyelesaikan booking yang sudah dibatalkan');
        }

        // Update booking status and completed_at
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.query(
            `UPDATE booking 
             SET status = 'completed', 
                 completed_at = ?
             WHERE id = ?`,
            [now, id]
        );

        await connection.commit();
        return { 
            id,
            status: 'completed',
            completed_at: now
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error completing booking:', error);
        throw new Error(`Error completing booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const getDashboardStats = async () => {
    try {
        const [currentMonth] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_harga ELSE 0 END), 0) as revenue,
                COUNT(DISTINCT CASE WHEN status = 'completed' OR payment_status = 'paid' THEN id END) as completed_orders,
                COUNT(DISTINCT user_id) as active_customers
            FROM transaksi 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
            AND status NOT IN ('expired', 'cancelled', 'failed')
        `);

        const [lastMonth] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_harga ELSE 0 END), 0) as revenue,
                COUNT(DISTINCT CASE WHEN status = 'completed' OR payment_status = 'paid' THEN id END) as completed_orders,
                COUNT(DISTINCT user_id) as active_customers
            FROM transaksi 
            WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            AND status NOT IN ('expired', 'cancelled', 'failed')
        `);

        const calcPercentage = (current, last) => {
            const currentVal = parseFloat(current) || 0;
            const lastVal = parseFloat(last) || 0;
            if (currentVal === 0 && lastVal === 0) return 0;
            if (lastVal === 0) {
                const assumedLastValue = currentVal * 0.2;
                const percentage = ((currentVal - assumedLastValue) / assumedLastValue * 100).toFixed(1);
                return Math.min(100, parseFloat(percentage));
            }
            const percentage = ((currentVal - lastVal) / lastVal * 100).toFixed(1);
            const boundedPercentage = Math.max(-100, Math.min(100, parseFloat(percentage)));
            return boundedPercentage > 0 ? `+${boundedPercentage}` : boundedPercentage;
        };

        return {
            title: "Dashboard She Salon",
            stats: {
                revenue: {
                    total: currentMonth[0].revenue,
                    percentage: calcPercentage(currentMonth[0].revenue, lastMonth[0].revenue),
                    period: "this month"
                },
                completedOrders: {
                    total: currentMonth[0].completed_orders,
                    percentage: calcPercentage(currentMonth[0].completed_orders, lastMonth[0].completed_orders),
                    period: "this month"
                },
                activeCustomers: {
                    total: currentMonth[0].active_customers,
                    percentage: calcPercentage(currentMonth[0].active_customers, lastMonth[0].active_customers),
                    period: "this month"
                }
            },
            recentTransactions: await getRecentTransactions(4)
        };
    } catch (err) {
        console.error('[AdminService] getDashboardStats error:', err);
        throw new Error('Gagal mengambil statistik dashboard');
    }
};

async function updateDashboardStats(io) {
    const dashboardData = await getDashboardStats();
    if (io) {
        io.emit('dashboard:update', {
            title: "Dashboard She Salon",
            ...dashboardData
        });
    }
}

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    getRecentTransactions,
    getAllTransactions,
    getTransactionsByUserId,
    getDashboardStats,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    completeBooking,
    updateDashboardStats,
    getBookingsByUserId
};