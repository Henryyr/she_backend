const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const redis = require('redis');

// Redis client setup
const client = redis.createClient();

const createBooking = async (req, res) => {
    const bookingData = {
        user_id: req.user.id,          // Ambil dari auth middleware
        layanan_id: req.body.layanan_id,
        tanggal: req.body.tanggal,
        jam_mulai: req.body.jam_mulai,
        hair_color: req.body.hair_color,
        smoothing_product: req.body.smoothing_product,
        keratin_product: req.body.keratin_product
    };

    try {
        const result = await bookingService.createBooking(bookingData);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllBookings = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    try {
        const results = await bookingService.getAllBookings(page, limit);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getBookingById = async (req, res) => {
    const { id } = req.params;
    
    client.get(`booking:${id}`, async (err, data) => {
        if (data) {
            return res.json(JSON.parse(data));
        } else {
            try {
                const booking = await bookingService.getBookingById(id);
                if (booking) {
                    client.setex(`booking:${id}`, 3600, JSON.stringify(booking)); // Cache for 1 hour
                    res.json(booking);
                } else {
                    res.status(404).json({ error: "Booking tidak ditemukan" });
                }
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        }
    });
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
