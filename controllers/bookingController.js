const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const { getIO } = require('../socketInstance');
const dashboardService = require('../services/admin/dashboardService');
const { validateBookingTime, validateUserDailyBooking } = require('../helpers/bookingValidationHelper');

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

const getAvailableSlots = async (req, res) => {
    try {
        const { tanggal, layanan_id } = req.query;
        if (!tanggal) {
            return res.status(400).json({ error: 'Parameter tanggal diperlukan' });
        }
        let duration = 60;
        let layananIds = [];
        if (layanan_id) {
            layananIds = Array.isArray(layanan_id)
                ? layanan_id
                : layanan_id.split(',').map(id => id.trim());
            const db = require('../db');
            const [layananRows] = await db.pool.query(
                `SELECT SUM(estimasi_waktu) as total_estimasi FROM layanan WHERE id IN (?)`,
                [layananIds]
            );
            if (layananRows[0]?.total_estimasi) {
                duration = layananRows[0].total_estimasi;
            }
        }
        const db = require('../db');
        const operatingHours = [
            '09:00', '10:00', '11:00', '12:00', '13:00', 
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
        ];
        const [bookings] = await db.pool.query(
            `SELECT jam_mulai, jam_selesai FROM booking 
             WHERE tanggal = ? AND status NOT IN ('canceled', 'completed')`,
            [tanggal]
        );
        function isOverlap(startA, endA, startB, endB) {
            return (startA < endB) && (endA > startB);
        }
        function toMinutes(timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        }
        const closingTime = '20:00';
        const closingMinutes = toMinutes(closingTime);
        const slotLayananMap = {};
        operatingHours.forEach(time => {
            const startMinutes = toMinutes(time);
            slotLayananMap[time] = allLayanan
                .filter(l => {
                    const endMinutes = startMinutes + l.estimasi_waktu;
                    if (endMinutes > closingMinutes) return false;
                    for (const b of bookings) {
                        const bStartMinutes = toMinutes(b.jam_mulai.length === 5 ? b.jam_mulai : b.jam_mulai.slice(0, 5));
                        const bEndMinutes = toMinutes(b.jam_selesai.length === 5 ? b.jam_selesai : b.jam_selesai.slice(0, 5));
                        if (startMinutes < bEndMinutes && endMinutes > bStartMinutes) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(l => ({ id: l.id, nama: l.nama }));
        });
        const availableSlots = [];
        const bookedSlots = [];
        for (const time of operatingHours) {
            if (slotLayananMap[time] && slotLayananMap[time].length > 0) {
                availableSlots.push(time);
            } else {
                bookedSlots.push(time);
            }
        }
        res.json({
            tanggal,
            layanan_id: layananIds.length > 0 ? layananIds : undefined,
            available_slots: availableSlots,
            booked_slots: bookedSlots,
            layanan_per_slot: slotLayananMap,
            total_available: availableSlots.length
        });
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
    getAvailableSlots,
    cancelBooking
};