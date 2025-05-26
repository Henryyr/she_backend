const dashboardService = require('../../services/admin/dashboardService');

const getDashboard = async (req, res) => {
    try {
        const dashboardData = await dashboardService.getDashboardStats();
        res.json({
            title: "Dashboard She Salon",
            ...dashboardData
        });
    } catch (err) {
        res.status(500).json({ message: "Terjadi kesalahan", error: err });
    }
};

module.exports = {
    getDashboard
};
