const adminService = require('../services/adminService');
const bookingService = require('../services/bookingService');

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

const getTransactionsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const transactions = await adminService.getTransactionsByUserId(userId, page, limit);

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

// New Admin Booking CRUD Methods
const getBookingById = async (req, res) => {
    try {
        const booking = await adminService.getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json(booking);
    } catch (error) {
        console.error('Failed to get booking:', error);
        res.status(500).json({ 
            message: 'Error retrieving booking',
            error: error.message 
        });
    }
};

// New method: Create booking as admin
const createBooking = async (req, res) => {
    try {
        // Validate if user ID is provided
        if (!req.body.user_id) {
            return res.status(400).json({ message: 'User ID diperlukan untuk membuat booking' });
        }

        const bookingData = {
            user_id: req.body.user_id,
            layanan_id: req.body.layanan_id,
            tanggal: req.body.tanggal,
            jam_mulai: req.body.jam_mulai,
            hair_color: req.body.hair_color,
            smoothing_product: req.body.smoothing_product,
            keratin_product: req.body.keratin_product,
            special_request: req.body.special_request || null
        };

        const result = await bookingService.createBooking(bookingData);
        
        // If there's a socket instance, update the dashboard in real-time
        const io = require('../socketInstance').getIO();
        if (io) {
            await emitDashboardUpdate(io);
        }

        res.status(201).json({
            message: 'Booking berhasil dibuat',
            booking: result
        });
    } catch (error) {
        console.error('Failed to create booking:', error);
        res.status(500).json({ 
            message: 'Error creating booking',
            error: error.message 
        });
    }
};

const updateBooking = async (req, res) => {
    try {
        const updatedBooking = await adminService.updateBooking(req.params.id, req.body);
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil diperbarui', booking: updatedBooking });
    } catch (error) {
        console.error('Failed to update booking:', error);
        res.status(500).json({ 
            message: 'Error updating booking',
            error: error.message 
        });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const result = await adminService.deleteBooking(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dihapus' });
    } catch (error) {
        console.error('Failed to delete booking:', error);
        res.status(500).json({ 
            message: 'Error deleting booking',
            error: error.message 
        });
    }
};

const confirmBooking = async (req, res) => {
    try {
        const result = await adminService.updateBookingStatus(req.params.id, 'confirmed');
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (error) {
        console.error('Failed to confirm booking:', error);
        res.status(500).json({ 
            message: 'Error confirming booking',
            error: error.message 
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const result = await adminService.updateBookingStatus(req.params.id, 'cancelled');
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (error) {
        console.error('Failed to cancel booking:', error);
        res.status(500).json({ 
            message: 'Error cancelling booking',
            error: error.message 
        });
    }
};

const completeBooking = async (req, res) => {
    try {
        const result = await adminService.completeBooking(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Treatment selesai', booking: result });
    } catch (error) {
        console.error('Failed to complete booking:', error);
        res.status(500).json({ 
            message: 'Error completing booking',
            error: error.message 
        });
    }
};

// Improved method: Update booking status with any valid status
const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Status diperlukan untuk update booking' });
        }
        
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Status tidak valid', 
                validStatuses 
            });
        }

        let result;
        if (status === 'completed') {
            result = await adminService.completeBooking(id);
        } else {
            result = await adminService.updateBookingStatus(id, status);
        }

        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }

        // If there's a socket instance, update the dashboard in real-time
        const io = require('../socketInstance').getIO();
        if (io) {
            await emitDashboardUpdate(io);
        }

        res.json({ 
            message: `Booking berhasil diubah ke status ${status}`,
            booking: result
        });
    } catch (error) {
        console.error('Failed to update booking status:', error);
        res.status(500).json({ 
            message: 'Error updating booking status',
            error: error.message 
        });
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
    getTransactionsByUserId,
    getAllBookings,
    getBookingById,
    createBooking, 
    updateBooking,
    deleteBooking,
    confirmBooking,
    cancelBooking,
    completeBooking,
    updateBookingStatus,
    emitDashboardUpdate,
    getBookingsByUserId
};