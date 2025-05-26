const bookingService = require('../../services/admin/bookingService');
const dashboardService = require('../../services/admin/dashboardService');

const getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await bookingService.getAllBookings(page, limit);

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
        const bookings = await bookingService.getBookingsByUserId(userId, page, limit);

        bookings.pagination.hasNextPage = page < bookings.pagination.totalPages;
        bookings.pagination.hasPrevPage = page > 1;
        bookings.pagination.nextPage = bookings.pagination.hasNextPage ? page + 1 : null;
        bookings.pagination.prevPage = bookings.pagination.hasPrevPage ? page - 1 : null;

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error retrieving booking',
            error: error.message 
        });
    }
};

const createBooking = async (req, res) => {
    try {
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
        
        const io = require('../../socketInstance').getIO();
        if (io) {
            await emitDashboardUpdate(io);
        }

        res.status(201).json({
            message: 'Booking berhasil dibuat',
            booking: result
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating booking',
            error: error.message 
        });
    }
};

const updateBooking = async (req, res) => {
    try {
        const updatedBooking = await bookingService.updateBooking(req.params.id, req.body);
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil diperbarui', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating booking',
            error: error.message 
        });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const result = await bookingService.deleteBooking(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting booking',
            error: error.message 
        });
    }
};

const confirmBooking = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus(req.params.id, 'confirmed');
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (error) {
        res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
};

const completeBooking = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus(req.params.id, 'completed');
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil diselesaikan' });
    } catch (error) {
        res.status(500).json({ message: 'Error completing booking', error: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus(req.params.id, 'cancelled');
        if (!result) {
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};

const emitDashboardUpdate = async (io) => {
    try {
        const dashboardData = await dashboardService.getDashboardStats();
        io.emit('dashboard:update', {
            title: "Dashboard She Salon",
            ...dashboardData
        });
    } catch (err) {
        // log error
    }
};

module.exports = {
    getAllBookings,
    getBookingsByUserId,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    emitDashboardUpdate,
    confirmBooking,
    completeBooking,
    cancelBooking
};
