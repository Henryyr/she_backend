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
    updateDashboardStats,
    getBookingsByUserId
};
