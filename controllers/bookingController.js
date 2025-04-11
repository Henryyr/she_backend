// controllers/bookingController.js
const db = require('../db');
const bookingService = require('../services/bookingService');
const emailService = require('../services/emailService');
const redis = require('redis');

// Redis client setup (kept in controller as in original code)
const client = redis.createClient();
const generateEmailTemplate = require('../html/emailTemplate');

const createBooking = async (req, res) => {
    const { layanan_id, tanggal, jam_mulai } = req.body;
    const user_id = req.user.id;

    if (!user_id) return res.status(401).json({ error: "User tidak ditemukan, pastikan sudah login" });
    if (!layanan_id || !Array.isArray(layanan_id) || layanan_id.length === 0) 
        return res.status(400).json({ error: "Harus memilih setidaknya satu layanan" });

    try {
        const result = await bookingService.createBooking(user_id, layanan_id, tanggal, jam_mulai);
        
        // Send email notification if booking created successfully
        if (result.email) {
            const layananList = result.layanan_terpilih.map(l => `🔹 ${l.nama} (Rp${l.harga})`).join("\n");
            const formattedDate = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const subject = "Konfirmasi Booking Anda";
            const htmlMessage = generateEmailTemplate(result, formattedDate, jam_mulai);
            
            await emailService.sendEmail(
                result.email, 
                subject, 
                `Booking baru telah dibuat!\n\nDetail Booking:\n${layananList}\nTanggal: ${tanggal}\nJam: ${jam_mulai}\nTotal: Rp${result.total_harga}\nKode Booking: ${result.booking_number}`, 
                htmlMessage
            );
        }

        res.json({ 
            message: "Booking berhasil dibuat!", 
            booking_id: result.booking_id, 
            status: "pending", 
            booking_number: result.booking_number, 
            total_harga: result.total_harga,
            email: result.email,
            layanan_terpilih: result.layanan_terpilih
        });
    } catch (err) {
        console.error("Error saat membuat booking:", err);
        res.status(500).json({ error: "Terjadi kesalahan, booking gagal dibuat." });
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
    
    // Original Redis cache implementation kept as is
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
    const { id } = req.params;
    
    try {
        await bookingService.deleteBooking(id);
        res.json({ message: 'Booking berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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