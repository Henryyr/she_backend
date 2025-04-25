const adminService = require('../services/adminService');

const getDashboard = async (req, res) => {
    try {
        const dashboardData = await adminService.getDashboardStats();
        res.json({
            title: "Dashboard She Salon",
            ...dashboardData
        });
    } catch (err) {
        res.status(500).json({ message: "Terjadi kesalahan", error: err });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userData = await adminService.getAllUsers(page, limit);
        res.json(userData);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil data users", error: err });
    }
};

const updateUser = async (req, res) => {
    try {
        const updated = await adminService.updateUser(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ message: "Gagal memperbarui user", error: err });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deleted = await adminService.deleteUser(req.params.id);
        if (!deleted) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: "Gagal menghapus user", error: err });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const transactions = await adminService.getAllTransactions(page, limit);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: "Terjadi kesalahan", error: err });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await adminService.getAllBookings(page, limit);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Terjadi kesalahan", error: err });
    }
};

module.exports = {
    getDashboard,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllTransactions,
    getAllBookings
};
