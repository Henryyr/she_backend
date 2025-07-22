const dashboardService = require('../../services/admin/dashboardService');
const { getIO } = require('../../socketInstance');

const getDashboard = async (req, res) => {
  try {
    const dashboardData = await dashboardService.getDashboardStats();
    // Emit update ke semua client dashboard sebelum response
    dashboardService.updateDashboardStats(getIO());
    res.json({
      title: 'Dashboard She Salon',
      ...dashboardData
    });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: err });
  }
};

module.exports = {
  getDashboard
};
