const bookingService = require('../../services/user/bookingService');
const emailService = require('../../services/user/emailService');
const { getIO } = require('../../socketInstance');
const dashboardService = require('../../services/admin/dashboardService');
const { validateBookingTime, validateUserDailyBooking } = require('../../helpers/bookingValidationHelper');

const createBooking = async (req, res) => {
    console.log('[BookingController] Masuk createBooking', { body: req.body, user: req.user });
    try {
        const cleanBody = JSON.parse(JSON.stringify(req.body));
        if (!cleanBody || Object.keys(cleanBody).length === 0) {
            return res.status(400).json({
                error: 'Invalid request body. Please provide valid JSON data.',
                timestamp: new Date().toISOString()
            });
        }

        const bookingData = {
            user_id: req.user.id,
            layanan_id: cleanBody.layanan_id,
            tanggal: cleanBody.tanggal,
            jam_mulai: cleanBody.jam_mulai,
            hair_color: cleanBody.hair_color,
            smoothing_product: cleanBody.smoothing_product,
            keratin_product: cleanBody.keratin_product,
            special_request: cleanBody.special_request || null,
            voucher_code: cleanBody.voucher_code || null
        };

        try {
            await validateBookingTime(bookingData.tanggal, bookingData.jam_mulai, req.user.id);
            await validateUserDailyBooking(bookingData.tanggal, req.user.id);
        } catch (validationError) {
            return res.status(409).json({
                error: 'Konflik waktu booking',
                message: validationError.message,
                timestamp: new Date().toISOString()
            });
        }

        try {
            const result = await bookingService.createBooking(bookingData);
            console.log('[BookingController] Booking berhasil', result);

            // Send email notification
            try {
                if (req.user.email) {
                    await emailService.sendBookingInformation(req.user.email, result);
                }
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }

            // Emit Socket.IO event for new booking
            const io = getIO();
            if (io) {
                try {
                    // Format booking data for admin notification
                    const bookingNotification = {
                        id: result.booking_number || result.id,
                        customer: req.user.fullname || req.user.nama || 'Unknown Customer',
                        date: result.tanggal,
                        start_time: result.jam_mulai,
                        end_time: result.jam_selesai,
                        services: result.layanan_names || result.layanan?.map(l => l.nama).join(', ') || 'N/A',
                        status: result.status || 'pending',
                        booking_number: result.booking_number
                    };

                    // Emit to admin room
                    io.to('admin-room').emit('new-booking', {
                        booking: bookingNotification,
                        message: `New booking from ${bookingNotification.customer}`,
                        timestamp: new Date().toISOString()
                    });

                    console.log('✅ New booking event emitted to admin room');

                    // Update dashboard stats
                    await dashboardService.updateDashboardStats(io);
                } catch (emitErr) {
                    console.error('Socket emit error:', emitErr);
                }
            }

            res.json(result);
        } catch (error) {
            console.error('[BookingController] Booking gagal:', error);
            return res.status(400).json({
                error: 'Booking gagal',
                details: error.message || error.toString(),
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('[BookingController] Error luar:', error);
        return res.status(400).json({
            error: 'Invalid request body',
            details: error.message || error.toString(),
            timestamp: new Date().toISOString()
        });
    }
};

const getAllBookings = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const results = await bookingService.getAllBookings(page, limit, req.user.id);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error retrieving booking',
            error: error.message 
        });
    }
};

const postAvailableSlots = async (req, res) => {
    try {
        const { tanggal, estimasi_waktu } = req.body;
        if (!tanggal) {
            return res.status(400).json({ error: 'Parameter tanggal diperlukan' });
        }
        const duration = estimasi_waktu && !isNaN(Number(estimasi_waktu)) ? Number(estimasi_waktu) : 60;
        const result = await bookingService.postAvailableSlots(tanggal, duration);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil jadwal tersedia', message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const booking = await bookingService.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ 
                error: 'Booking tidak ditemukan',
                message: 'Data booking tidak ditemukan. Silakan cek kembali atau hubungi admin.'
            });
        }

        if (booking.user_id !== user.id) {
            return res.status(403).json({
                error: 'Akses ditolak',
                message: 'Anda tidak memiliki izin untuk membatalkan booking ini.'
            });
        }

        if (booking.status === 'canceled') {
            return res.status(400).json({
                error: 'Booking sudah dibatalkan',
                message: 'Booking ini sudah dibatalkan sebelumnya.'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                error: 'Booking sudah selesai',
                message: 'Booking yang sudah selesai tidak dapat dibatalkan.'
            });
        }

        const tanggalStr = typeof booking.tanggal === 'string' ? booking.tanggal.split('T')[0] : booking.tanggal;
        const jamStr = booking.jam_mulai.length === 5 ? booking.jam_mulai : booking.jam_mulai.slice(0, 5);
        const startDateTime = new Date(`${tanggalStr}T${jamStr}:00+08:00`);
        const now = new Date();
        const batasCancel = new Date(startDateTime.getTime() + 30 * 60000);

        if (now > batasCancel) {
            return res.status(400).json({
                error: 'Batas pembatalan telah lewat',
                message: 'Pembatalan hanya dapat dilakukan maksimal 30 menit setelah jam mulai booking.'
            });
        }

        const result = await bookingService.cancelBooking(id);

        // Emit Socket.IO event for booking cancellation
        const io = getIO();
        if (io) {
            try {
                // Emit booking cancellation to admin room
                io.to('admin-room').emit('booking-cancelled', {
                    booking_id: id,
                    customer: user.fullname || user.nama || 'Unknown Customer',
                    message: `Booking #${booking.booking_number || id} has been cancelled by customer`,
                    timestamp: new Date().toISOString()
                });

                console.log('✅ Booking cancellation event emitted to admin room');

                // Update dashboard stats
                await dashboardService.updateDashboardStats(io);
            } catch (emitErr) {
                console.error('Socket emit error:', emitErr);
            }
        }

        res.json({
            message: 'Booking berhasil dibatalkan',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            error: 'Gagal membatalkan booking',
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    postAvailableSlots,
    cancelBooking
};