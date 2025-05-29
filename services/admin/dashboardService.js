const { pool } = require('../../db');
const transactionService = require('./transactionService');

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
