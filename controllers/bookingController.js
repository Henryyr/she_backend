const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const { emitDashboardUpdate } = require('./adminController');
const { getIO } = require('../socketInstance');

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

        const result = await bookingService.createBooking(bookingData);

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
        const results = await bookingService.getAllBookings(page, limit);
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

const sendTestEmail = async (req, res) => {
    try {
        await emailService.sendEmail();
        res.send("Email sedang dikirim...");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const confirmBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'confirmed');
        res.json({ message: 'Booking berhasil dikonfirmasi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cancelBooking = async (req, res) => {
    const { bookingNumber } = req.params;
    
    try {
        await bookingService.updateBookingStatus(bookingNumber, 'canceled');
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
        res.json({ message: 'Treatment selesai' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    sendTestEmail,
    confirmBooking,
    cancelBooking,
    deleteBooking,
    completeBooking
};
