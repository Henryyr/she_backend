const bookingService = require('../../services/user/bookingService');
const emailService = require('../../services/user/emailService');
const { getIO } = require('../../socketInstance');
const dashboardService = require('../../services/admin/dashboardService');
const { validateBookingTime, validateUserDailyBooking } = require('../../helpers/bookingValidationHelper');

const createBooking = async (req, res) => {
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
            special_request: cleanBody.special_request || null
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
        const result = await bookingService.createBooking(bookingData);
        try {
            if (req.user.email) {
                await emailService.sendBookingInformation(req.user.email, result);
            }
        } catch (emailErr) {}
        const io = getIO();
        if (io) {
            try {
                await dashboardService.updateDashboardStats(io);
            } catch (emitErr) {}
        }
        res.json(result);
    } catch (error) {
        return res.status(400).json({
            error: 'Invalid JSON format',
            details: error.message,
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
        emitDashboardUpdate();
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