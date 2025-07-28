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

    // Langkah baru: Langsung tandai booking sebagai 'completed'
    await bookingService.updateBookingStatus(result.booking_id, 'completed');

    // Buat transaksi untuk booking offline yang sudah selesai
    const connection = await require('../../db').pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cek apakah sudah ada transaksi untuk booking ini
      const [existingTransaction] = await connection.query(
        'SELECT id FROM transaksi WHERE booking_id = ?',
        [result.booking_id]
      );

      if (existingTransaction.length === 0) {
        // Buat transaksi baru dengan status paid untuk booking offline
        await connection.query(
          `INSERT INTO transaksi (booking_id, total_harga, dp_amount, paid_amount, payment_status, status, payment_method) 
           VALUES (?, ?, ?, ?, 'paid', 'completed', 'offline')`,
          [result.booking_id, result.total_harga, 0, result.total_harga]
        );
      }

      await connection.commit();
    } catch (transactionError) {
      await connection.rollback();
      console.error('Error creating transaction for offline booking:', transactionError);
      // Jangan throw error, karena booking sudah dibuat
    } finally {
      connection.release();
    }

    // Ambil data booking yang sudah diupdate
    const updatedBooking = await bookingService.getBookingById(result.booking_id);

    // Emit Socket.IO event for offline booking
    const io = getIO();
    if (io) {
      try {
        const bookingNotification = {
          id: updatedBooking.booking_number || updatedBooking.id,
          customer: updatedBooking.customer_name || 'Offline Customer',
          date: updatedBooking.tanggal,
          start_time: updatedBooking.jam_mulai,
          end_time: updatedBooking.jam_selesai,
          services: updatedBooking.services || 'N/A',
          status: updatedBooking.status || 'completed',
          booking_number: updatedBooking.booking_number
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
      message: 'Booking offline berhasil dibuat dan diselesaikan',
      booking: updatedBooking
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
