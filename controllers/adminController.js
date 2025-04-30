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

        // Tambahkan properti untuk navigasi pagination
        userData.pagination.hasNextPage = page < userData.pagination.totalPages;
        userData.pagination.hasPrevPage = page > 1;
        userData.pagination.nextPage = userData.pagination.hasNextPage ? page + 1 : null;
        userData.pagination.prevPage = userData.pagination.hasPrevPage ? page - 1 : null;

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data users", error: error.message });
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

        transactions.pagination.hasNextPage = page < transactions.pagination.totalPages;
        transactions.pagination.hasPrevPage = page > 1;
        transactions.pagination.nextPage = transactions.pagination.hasNextPage ? page + 1 : null;
        transactions.pagination.prevPage = transactions.pagination.hasPrevPage ? page - 1 : null;

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await adminService.getAllBookings(page, limit);

        bookings.pagination.hasNextPage = page < bookings.pagination.totalPages;
        bookings.pagination.hasPrevPage = page > 1;
        bookings.pagination.nextPage = bookings.pagination.hasNextPage ? page + 1 : null;
        bookings.pagination.prevPage = bookings.pagination.hasPrevPage ? page - 1 : null;

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

const getBookingsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await adminService.getBookingsByUserId(userId, page, limit);

        bookings.pagination.hasNextPage = page < bookings.pagination.totalPages;
        bookings.pagination.hasPrevPage = page > 1;
        bookings.pagination.nextPage = bookings.pagination.hasNextPage ? page + 1 : null;
        bookings.pagination.prevPage = bookings.pagination.hasPrevPage ? page - 1 : null;

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

// Emit update dashboard ke semua client yang terhubung
const emitDashboardUpdate = async (io) => {
    try {
        const dashboardData = await adminService.getDashboardStats();
        io.emit('dashboard:update', {
            title: "Dashboard She Salon",
            ...dashboardData
        });
    } catch (err) {
        console.error('[AdminController] Emit dashboard update failed:', err);
    }
};

module.exports = {
    getDashboard,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllTransactions,
    getAllBookings,
    emitDashboardUpdate,
    getBookingsByUserId
};
