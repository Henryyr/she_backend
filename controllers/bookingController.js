const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const { emitDashboardUpdate } = require('./adminController');
const { getIO } = require('../socketInstance');
const { validateBookingTime, validateUserDailyBooking } = require('../helpers/bookingValidationHelper');

const createBooking = async (req, res) => {
    console.log('[BookingController] Received booking request:', {
        body: req.body,
        user: req.user?.id,
        ip: req.ip
    });

    try {
        // Validate JSON structure
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

        // VALIDASI WAKTU BOOKING
        try {
            // 1. Validasi jam tidak bentrok dengan booking lain
            await validateBookingTime(bookingData.tanggal, bookingData.jam_mulai, req.user.id);
            
            // 2. Validasi user tidak booking lebih dari 1x per hari
            await validateUserDailyBooking(bookingData.tanggal, req.user.id);
            
        } catch (validationError) {
            return res.status(409).json({
                error: 'Konflik waktu booking',
                message: validationError.message,
                timestamp: new Date().toISOString()
            });
        }

        const result = await bookingService.createBooking(bookingData);

        // Send booking confirmation email to user if user has email
        try {
            if (req.user.email) {
                await emailService.sendBookingInformation(req.user.email, result);
                console.log('[BookingController] Confirmation email sent to user:', req.user.email);
            }
        } catch (emailErr) {
            console.error('[BookingController] Failed to send confirmation email:', emailErr);
            // We don't want to fail the booking if email fails
        }

        // Emit update dashboard realtime jika booking berhasil
        const io = getIO();
        if (io) {
            try {
                await emitDashboardUpdate(io);
            } catch (emitErr) {
                console.error('[BookingController] Emit dashboard update failed:', emitErr);
            }
        }

        res.json(result);
    } catch (error) {
        console.error('[BookingController] Error:', {
            message: error.message,
            body: JSON.stringify(req.body),
            timestamp: new Date().toISOString()
        });
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
        // User hanya bisa melihat booking mereka sendiri
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
        console.error('Failed to get booking:', error);
        res.status(500).json({ 
            message: 'Error retrieving booking',
            error: error.message 
        });
    }
};

// Method untuk mendapatkan jadwal yang tersedia
const getAvailableSlots = async (req, res) => {
    try {
        const { tanggal, layanan_id } = req.query;
        if (!tanggal) {
            return res.status(400).json({ error: 'Parameter tanggal diperlukan' });
        }

        let duration = 60; // default 60 menit
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

        // Pisahkan slot yang available dan yang booked
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

        // Validasi kepemilikan booking
        if (booking.user_id !== user.id) {
            return res.status(403).json({
                error: 'Akses ditolak',
                message: 'Anda tidak memiliki izin untuk membatalkan booking ini.'
            });
        }

        // Booking sudah dibatalkan atau sudah selesai
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

        // Hitung batas waktu pembatalan (maksimal 30 menit setelah jam_mulai)
        const tanggalStr = typeof booking.tanggal === 'string' ? booking.tanggal.split('T')[0] : booking.tanggal;
        const jamStr = booking.jam_mulai.length === 5 ? booking.jam_mulai : booking.jam_mulai.slice(0, 5);
        const startDateTime = new Date(`${tanggalStr}T${jamStr}:00+08:00`); // WITA

        const now = new Date();
        const batasCancel = new Date(startDateTime.getTime() + 30 * 60000); // 30 menit SETELAH jam_mulai

        if (now > batasCancel) {
            return res.status(400).json({
                error: 'Batas pembatalan telah lewat',
                message: 'Pembatalan hanya dapat dilakukan maksimal 30 menit setelah jam mulai booking.'
            });
        }

        // Jalankan pembatalan
        const result = await bookingService.cancelBooking(id);

        // Emit update ke dashboard jika diperlukan
        emitDashboardUpdate();

        res.json({
            message: 'Booking berhasil dibatalkan',
            data: result
        });

    } catch (error) {
        console.error('[BookingController] Error saat cancel booking:', error);
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