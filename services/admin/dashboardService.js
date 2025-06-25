const { pool } = require('../../db');
const transactionService = require('./transactionService');

const getDashboardStats = async () => {
    try {
        // Revenue bulan ini dan bulan lalu (payment_status = 'Paid')
        const [revenueRows] = await pool.query(`
            SELECT
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN total_harga ELSE 0 END) as current_revenue,
                SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN total_harga ELSE 0 END) as last_revenue
            FROM transaksi
            WHERE payment_status = 'Paid'
        `);

        // Completed orders bulan ini dan bulan lalu (booking.status = 'completed')
        const [completedRows] = await pool.query(`
            SELECT
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as current_completed,
                SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_completed
            FROM booking
            WHERE status = 'completed'
        `);

        // Active customers & new active customers (MySQL 8+ CTE)
        const [activeRows] = await pool.query(`
            WITH
            active_current AS (
                SELECT DISTINCT u.id
                FROM users u
                JOIN transaksi t ON u.id = t.user_id
                WHERE u.role = 'pelanggan'
                AND MONTH(t.created_at) = MONTH(CURRENT_DATE())
                AND YEAR(t.created_at) = YEAR(CURRENT_DATE())
                AND t.status NOT IN ('expired', 'cancelled', 'failed')
            ),
            active_last AS (
                SELECT DISTINCT u.id
                FROM users u
                JOIN transaksi t ON u.id = t.user_id
                WHERE u.role = 'pelanggan'
                AND MONTH(t.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND YEAR(t.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND t.status NOT IN ('expired', 'cancelled', 'failed')
            )
            SELECT
                (SELECT COUNT(*) FROM active_current) as active_customers,
                (SELECT COUNT(*) FROM active_last) as active_customers_last,
                (SELECT COUNT(*) FROM active_current WHERE id NOT IN (SELECT id FROM active_last)) as new_active_customers
        `);

        // Helper for percentage calculation
        const calcPercentage = (current, last) => {
            const currentVal = parseFloat(current) || 0;
            const lastVal = parseFloat(last) || 0;
            if (lastVal === 0) {
                if (currentVal === 0) return "0.0";
                return "+100.0";
            }
            const percentage = ((currentVal - lastVal) / Math.abs(lastVal)) * 100;
            const rounded = percentage.toFixed(1);
            if (percentage > 0) return `+${rounded}`;
            if (percentage < 0) return `${rounded}`;
            return "0.0";
        };

        // Assign values
        const revenueCurrent = parseFloat(revenueRows[0].current_revenue) || 0;
        const revenueLast = parseFloat(revenueRows[0].last_revenue) || 0;
        const completedCurrent = parseInt(completedRows[0].current_completed) || 0;
        const completedLast = parseInt(completedRows[0].last_completed) || 0;
        const activeCurrent = parseInt(activeRows[0].active_customers) || 0;
        const activeLast = parseInt(activeRows[0].active_customers_last) || 0;
        const newActive = parseInt(activeRows[0].new_active_customers) || 0;

        return {
            stats: {
                revenue: {
                    total: revenueCurrent,
                    percentage: calcPercentage(revenueCurrent, revenueLast),
                    period: "this month"
                },
                completedOrders: {
                    total: completedCurrent,
                    percentage: calcPercentage(completedCurrent, completedLast),
                    period: "this month"
                },
                activeCustomers: {
                    total: activeCurrent,
                    // Persentase pelanggan baru dibanding total active bulan ini (real value)
                    percentage: activeCurrent === 0 ? "0.0" : `+${((newActive / activeCurrent) * 100).toFixed(1)}`,
                    period: "this month"
                }
            },
            recentTransactions: await transactionService.getRecentTransactions(4)
        };
    } catch (err) {
        console.error('[DashboardService] getDashboardStats error:', err);
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
    getDashboardStats,
    updateDashboardStats
};
