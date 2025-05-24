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

        // Hitung estimasi waktu booking (dalam menit)
        let estimasi_waktu = 60;
        try {
            const db = require('../db');
            const [allLayanan] = await db.pool.query(
                `SELECT id, estimasi_waktu FROM layanan`
            );
            let layananIds = [];
            if (bookingData.layanan_id) {
                layananIds = Array.isArray(bookingData.layanan_id)
                    ? bookingData.layanan_id
                    : [bookingData.layanan_id];
                const selectedLayanan = allLayanan.filter(l => layananIds.includes(String(l.id)) || layananIds.includes(Number(l.id)));
                if (selectedLayanan.length > 0) {
                    estimasi_waktu = selectedLayanan.reduce((sum, l) => sum + l.estimasi_waktu, 0);
                }
            }
        } catch (e) {
            // fallback default
            estimasi_waktu = 60;
        }

        // VALIDASI WAKTU BOOKING
        try {
            // 1. Validasi jam tidak bentrok dengan booking lain (overlap)
            await validateBookingTime(
                bookingData.tanggal,
                bookingData.jam_mulai,
                estimasi_waktu,
                req.user.id
            );
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

        let layananIds = [];
        let duration = 60; // default 60 menit

        const db = require('../db');
        const [allLayanan] = await db.pool.query(
            `SELECT id, nama, estimasi_waktu FROM layanan`
        );

        if (layanan_id) {
            layananIds = Array.isArray(layanan_id)
                ? layanan_id
                : layanan_id.split(',').map(id => id.trim());

            const selectedLayanan = allLayanan.filter(l => layananIds.includes(String(l.id)));
            if (selectedLayanan.length !== layananIds.length) {
                return res.status(400).json({ error: 'Beberapa layanan tidak ditemukan' });
            }
            duration = selectedLayanan.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        }

        const operatingHours = [
            '09:00', '10:00', '11:00', '12:00', '13:00', 
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
        ];

        const [bookings] = await db.pool.query(
            `SELECT jam_mulai, jam_selesai FROM booking 
             WHERE tanggal = ? AND status NOT IN ('canceled', 'completed')`,
            [tanggal]
        );

        function toMinutes(timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        }

        // Sort bookings by jam_mulai ascending
        bookings.sort((a, b) => toMinutes(a.jam_mulai) - toMinutes(b.jam_mulai));

        const availableSlots = [];
        const bookedSlots = [];

        for (const time of operatingHours) {
            const startMinutes = toMinutes(time);
            const endMinutes = startMinutes + duration;

            // Cari booking berikutnya setelah slot ini
            const nextBooking = bookings.find(b => toMinutes(b.jam_mulai) > startMinutes);

            // Slot available jika TIDAK overlap dengan booking manapun
            let canBook = true;
            for (const b of bookings) {
                const bStart = toMinutes(b.jam_mulai.length === 5 ? b.jam_mulai : b.jam_mulai.slice(0, 5));
                const bEnd = toMinutes(b.jam_selesai.length === 5 ? b.jam_selesai : b.jam_selesai.slice(0, 5));
                // Jika ada overlap, slot tidak available
                if (startMinutes < bEnd && endMinutes > bStart) {
                    canBook = false;
                    break;
                }
            }

            // Jika ada booking berikutnya, layanan tidak boleh melewati jam booking berikutnya
            if (canBook && nextBooking) {
                const nextStart = toMinutes(nextBooking.jam_mulai.length === 5 ? nextBooking.jam_mulai : nextBooking.jam_mulai.slice(0, 5));
                if (endMinutes > nextStart) {
                    canBook = false;
                }
            }

            if (canBook) {
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
            total_available: availableSlots.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil jadwal tersedia', message: error.message });
    }
};

const confirmBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'confirmed');
        
        // Get booking details to send confirmation email
        const booking = await bookingService.getBookingById(bookingNumber);
        
        // Send email notification
        if (booking && booking.user_email) {
            try {
                await emailService.sendEmail(
                    booking.user_email,
                    `Booking #${bookingNumber} Dikonfirmasi`,
                    `Booking Anda dengan nomor ${bookingNumber} telah dikonfirmasi.`,
                    `<h3>Booking Dikonfirmasi</h3><p>Booking Anda dengan nomor ${bookingNumber} telah dikonfirmasi.</p>`
                );
            } catch (emailErr) {
                console.error('Failed to send confirmation email:', emailErr);
            }
        }
        
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cancelBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'canceled');
        
        // Get booking details to send cancellation email
        const booking = await bookingService.getBookingById(bookingNumber);
        
        // Send email notification
        if (booking && booking.user_email) {
            try {
                await emailService.sendEmail(
                    booking.user_email,
                    `Booking #${bookingNumber} Dibatalkan`,
                    `Booking Anda dengan nomor ${bookingNumber} telah dibatalkan.`,
                    `<h3>Booking Dibatalkan</h3><p>Booking Anda dengan nomor ${bookingNumber} telah dibatalkan.</p>`
                );
            } catch (emailErr) {
                console.error('Failed to send cancellation email:', emailErr);
            }
        }
        
        res.json({ message: 'Booking berhasil dibatalkan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteBooking = async (req, res) => {
    const tag = '[BookingController.deleteBooking]';
    try {
        const { id } = req.params;
        console.log(`${tag} started - booking_id:`, id);
        
        const result = await bookingService.deleteBooking(id);
        console.log(`${tag} success - booking_id:`, id);
        
        res.json(result);
    } catch (error) {
        console.error(`${tag} error:`, error);
        res.status(error.status || 500).json({ 
            error: error.message || "Internal Server Error" 
        });
    }
};

const completeBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Hanya admin yang dapat menyelesaikan booking" });
        }

        await bookingService.completeBooking(bookingNumber);
        
        // Get booking details to send completion email
        const booking = await bookingService.getBookingById(bookingNumber);
        
        // Send email notification
        if (booking && booking.user_email) {
            try {
                await emailService.sendEmail(
                    booking.user_email,
                    `Treatment #${bookingNumber} Selesai`,
                    `Treatment Anda dengan nomor ${bookingNumber} telah selesai. Terima kasih telah menggunakan layanan kami.`,
                    `<h3>Treatment Selesai</h3><p>Treatment Anda dengan nomor ${bookingNumber} telah selesai. Terima kasih telah menggunakan layanan kami.</p>`
                );
            } catch (emailErr) {
                console.error('Failed to send completion email:', emailErr);
            }
        }
        
        res.json({ message: 'Treatment selesai' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    getAvailableSlots,
    confirmBooking,
    cancelBooking,
    deleteBooking,
    completeBooking
};