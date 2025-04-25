const { pool } = require('../db');

const getAllUsers = async () => {
    const [results] = await pool.query(
        "SELECT id, fullname, email, phone_number, username, address, role FROM users"
    );
    return results;
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
    const offset = (page - 1) * limit;
    
    const [transactions] = await pool.query(`
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
        FORCE INDEX (idx_created_status)
        JOIN users u USE INDEX (PRIMARY) ON t.user_id = u.id
        JOIN booking b ON t.booking_id = b.id
        JOIN kategori_transaksi k USE INDEX (PRIMARY) ON t.kategori_transaksi_id = k.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        WHERE t.status NOT IN ('expired', 'cancelled', 'failed')
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as total 
        FROM transaksi t
        FORCE INDEX (idx_created_status)
        WHERE t.status NOT IN ('expired', 'cancelled', 'failed')
    `);

    return {
        transactions,
        pagination: {
            total: totalCount[0].total,
            page,
            limit,
            totalPages: Math.ceil(totalCount[0].total / limit)
        }
    };
};

const getDashboardStats = async () => {
    // Get current month stats
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

    // Get last month stats
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
        
        // Jika kedua nilai 0, tidak ada perubahan
        if (currentVal === 0 && lastVal === 0) return 0;
        
        // Jika nilai bulan lalu 0, gunakan nilai minimal
        if (lastVal === 0) {
            // Untuk menghindari persentase yang terlalu besar,
            // kita anggap nilai sebelumnya adalah 20% dari nilai saat ini
            const assumedLastValue = currentVal * 0.2;
            const percentage = ((currentVal - assumedLastValue) / assumedLastValue * 100).toFixed(1);
            // Batasi maksimal kenaikan 100%
            return Math.min(100, parseFloat(percentage));
        }
        
        // Hitung persentase normal dan batasi antara -100 sampai +100
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
};

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    getRecentTransactions,
    getAllTransactions,
    getDashboardStats
};
