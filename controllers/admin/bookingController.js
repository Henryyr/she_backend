const bookingService = require('../../services/admin/bookingService');
const dashboardService = require('../../services/admin/dashboardService');
const userBookingService = require('../../services/user/bookingService');
const { getIO } = require('../../socketInstance');

const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status ? req.query.status.trim().toLowerCase() : undefined;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const bookings = await bookingService.getAllBookings(page, limit, status, startDate, endDate);

    bookings.pagination.hasNextPage = page < bookings.pagination.totalPages;
    bookings.pagination.hasPrevPage = page > 1;
    bookings.pagination.nextPage = bookings.pagination.hasNextPage ? page + 1 : null;
    bookings.pagination.prevPage = bookings.pagination.hasPrevPage ? page - 1 : null;

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getBookingsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status ? req.query.status.trim().toLowerCase() : undefined;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const bookings = await bookingService.getBookingsByUserId(userId, page, limit, status, startDate, endDate);

    bookings.pagination.hasNextPage = page < bookings.pagination.totalPages;
    bookings.pagination.hasPrevPage = page > 1;
    bookings.pagination.nextPage = bookings.pagination.hasNextPage ? page + 1 : null;
    bookings.pagination.prevPage = bookings.pagination.hasPrevPage ? page - 1 : null;

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
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

const createOfflineBooking = async (req, res) => {
  try {
    if (!req.body.user_id) {
      return res.status(400).json({ message: 'User ID diperlukan untuk booking offline' });
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

    const result = await userBookingService.createBooking(bookingData);

    // Emit Socket.IO event for offline booking
    const io = getIO();
    if (io) {
      try {
        const bookingNotification = {
          id: result.booking_number || result.id,
          customer: result.user?.fullname || result.user?.nama || 'Offline Customer',
          date: result.tanggal,
          start_time: result.jam_mulai,
          end_time: result.jam_selesai,
          services: result.layanan_names || result.layanan?.map(l => l.nama).join(', ') || 'N/A',
          status: result.status || 'confirmed',
          booking_number: result.booking_number
        };

        // Emit to admin room
        io.to('admin-room').emit('new-booking', {
          booking: bookingNotification,
          message: `New offline booking created for ${bookingNotification.customer}`,
          timestamp: new Date().toISOString(),
          isOfflineBooking: true
        });

        console.log('✅ New offline booking event emitted to admin room');

        // Update dashboard stats
        await dashboardService.updateDashboardStats(io);
      } catch (emitErr) {
        console.error('Socket emit error:', emitErr);
      }
    }

    res.status(201).json({
      message: 'Booking offline berhasil dibuat',
      booking: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating offline booking',
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

    // Emit Socket.IO event for booking confirmation
    const io = getIO();
    if (io) {
      try {
        io.to('admin-room').emit('booking-status-updated', {
          booking_id: parseInt(req.params.id),
          status: 'confirmed',
          message: `Booking #${req.params.id} has been confirmed`,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Booking confirmation event emitted: ${req.params.id} -> confirmed`);

        // Update dashboard stats
        await dashboardService.updateDashboardStats(io);
      } catch (emitErr) {
        console.error('Socket emit error:', emitErr);
      }
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

    // Emit Socket.IO event for booking completion
    const io = getIO();
    if (io) {
      try {
        io.to('admin-room').emit('booking-status-updated', {
          booking_id: parseInt(req.params.id),
          status: 'completed',
          message: `Booking #${req.params.id} has been completed`,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Booking completion event emitted: ${req.params.id} -> completed`);

        // Update dashboard stats
        await dashboardService.updateDashboardStats(io);
      } catch (emitErr) {
        console.error('Socket emit error:', emitErr);
      }
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

    // Emit Socket.IO event for booking cancellation by admin
    const io = getIO();
    if (io) {
      try {
        io.to('admin-room').emit('booking-status-updated', {
          booking_id: parseInt(req.params.id),
          status: 'cancelled',
          message: `Booking #${req.params.id} has been cancelled by admin`,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Booking cancellation event emitted: ${req.params.id} -> cancelled`);

        // Update dashboard stats
        await dashboardService.updateDashboardStats(io);
      } catch (emitErr) {
        console.error('Socket emit error:', emitErr);
      }
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
      title: 'Dashboard She Salon',
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
  updateBooking,
  deleteBooking,
  emitDashboardUpdate,
  confirmBooking,
  completeBooking,
  cancelBooking,
  createOfflineBooking
};
