const { pool } = require('../../db');
const { getRecentTransactions } = require('./transactionService');

const getDashboardStats = async () => {
  try {
    // Revenue bulan ini & bulan lalu
    const [revenueRows] = await pool.query(`
            SELECT
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN total_harga ELSE 0 END) as current_revenue,
                SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN total_harga ELSE 0 END) as last_revenue
            FROM transaksi
            WHERE payment_status = 'Paid'
        `);

    // Completed booking bulan ini & bulan lalu
    const [completedRows] = await pool.query(`
            SELECT
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as current_completed,
                SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_completed
            FROM booking
            WHERE status = 'completed'
        `);

    // Active customer data
    const [activeRows] = await pool.query(`
            WITH
            active_current AS (
                SELECT DISTINCT user_id
                FROM transaksi
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                  AND YEAR(created_at) = YEAR(CURRENT_DATE())
                  AND status NOT IN ('expired', 'cancelled', 'failed')
            ),
            active_last AS (
                SELECT DISTINCT user_id
                FROM transaksi
                WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                  AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                  AND status NOT IN ('expired', 'cancelled', 'failed')
            )
            SELECT
                (SELECT COUNT(*) FROM active_current) as active_customers,
                (SELECT COUNT(*) FROM active_last) as active_last_customers,
                (SELECT COUNT(*) FROM active_current WHERE user_id NOT IN (SELECT user_id FROM active_last)) as new_active_customers
        `);

    // Helper persentase
    const calcPercentage = (current, last) => {
      const currentVal = parseFloat(current) || 0;
      const lastVal = parseFloat(last) || 0;
      if (lastVal === 0) {
        return currentVal === 0 ? '0.0' : '+100.0';
      }
      const percentage = ((currentVal - lastVal) / Math.abs(lastVal)) * 100;
      const rounded = percentage.toFixed(1);
      return percentage > 0 ? `+${rounded}` : `${rounded}`;
    };

    const revenueCurrent = parseFloat(revenueRows[0].current_revenue) || 0;
    const revenueLast = parseFloat(revenueRows[0].last_revenue) || 0;

    const completedCurrent = parseInt(completedRows[0].current_completed) || 0;
    const completedLast = parseInt(completedRows[0].last_completed) || 0;

    const activeCurrent = parseInt(activeRows[0].active_customers) || 0;
    const activeLast = parseInt(activeRows[0].active_last_customers) || 0;
    const newActive = parseInt(activeRows[0].new_active_customers) || 0;

    return {
      stats: {
        revenue: {
          total: revenueCurrent,
          percentage: calcPercentage(revenueCurrent, revenueLast),
          period: 'this month'
        },
        completedOrders: {
          total: completedCurrent,
          percentage: calcPercentage(completedCurrent, completedLast),
          period: 'this month'
        },
        activeCustomers: {
          total: activeCurrent,
          lastMonth: activeLast,
          newActive,
          percentage: calcPercentage(activeCurrent, activeLast),
          period: 'this month'
        }
      },
      recentTransactions: await getRecentTransactions(4)
    };
  } catch (err) {
    console.error('[DashboardService] getDashboardStats error:', err);
    throw new Error('Gagal mengambil statistik dashboard');
  }
};

const updateDashboardStats = async (io) => {
  try {
    const dashboardData = await getDashboardStats();
    if (io) {
      io.emit('dashboard:update', {
        title: 'Dashboard She Salon',
        ...dashboardData
      });
    }
  } catch (err) {
    console.error('[DashboardService] updateDashboardStats error:', err);
  }
};

module.exports = {
  getDashboardStats,
  updateDashboardStats
};
