// services/bookingService.js
const db = require('../db');
const bookingHelper = require('../helpers/bookingHelper');

const createBooking = async (user_id, layanan_id, tanggal, jam_mulai) => {
    console.log('Creating booking:', { user_id, layanan_id, tanggal, jam_mulai });
    try {
        await db.promise().beginTransaction(); // Mulai transaksi

        const [existingBookings] = await db.promise().query(
            `SELECT id FROM booking WHERE user_id = ? AND tanggal = ? FOR UPDATE`,
            [user_id, tanggal]
        );

        if (existingBookings.length > 0) {
            await db.promise().rollback();
            throw new Error("Anda sudah memiliki booking pada hari ini. Silakan pilih hari lain.");
        }

        const [layananResults] = await db.promise().query(
            `SELECT id, nama, estimasi_waktu, harga FROM layanan WHERE id IN (?)`, 
            [layanan_id]
        );

        if (layananResults.length === 0) {
            await db.promise().rollback();
            throw new Error("Layanan tidak ditemukan");
        }

        const total_harga = layananResults.reduce((sum, layanan) => sum + parseFloat(layanan.harga), 0);
        const total_estimasi = layananResults.reduce((sum, layanan) => sum + layanan.estimasi_waktu, 0);
        const bookingNumber = await bookingHelper.generateBookingNumber();

        const [result] = await db.promise().query(
            `INSERT INTO booking (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga)
            VALUES (?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), 'pending', ?, ?)`,

            [user_id, tanggal, jam_mulai, jam_mulai, total_estimasi, bookingNumber, parseFloat(total_harga)]
        );

        const booking_id = result.insertId;

        const values = layananResults.map(layanan => [booking_id, layanan.id]);
        if (values.length > 0) {
            await db.promise().query(`INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`, [values]);
        }

        await db.promise().commit(); // Commit transaksi jika semua berhasil

        // Get user email
        const [userResults] = await db.promise().query('SELECT email FROM users WHERE id = ?', [user_id]);
        const email = userResults.length > 0 ? userResults[0].email : null;

        console.log("Email penerima:", email);  // Keep original debugging log

        const layanan_terpilih = layananResults.map(l => ({
            id: l.id,
            nama: l.nama,
            harga: l.harga
        }));

        console.log(`Booking created successfully. ID: ${booking_id}, Number: ${bookingNumber}`);

        return {
            booking_id,
            status: "pending",
            booking_number: bookingNumber,
            total_harga,
            email,
            layanan_terpilih
        };
    } catch (err) {
        console.error('Failed to create booking:', err);
        await db.promise().rollback(); // Jika ada error, rollback transaksi
        throw err;
    }
};

const getAllBookings = async (page, limit) => {
    console.log(`Fetching bookings (page: ${page}, limit: ${limit})`);
    try {
        const [results] = await db.promise().query(
            `SELECT b.*, u.phone_number, GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            GROUP BY b.id
            LIMIT ? OFFSET ?`,
            [parseInt(limit), (page - 1) * limit]
        );
        console.log(`Found ${results.length} bookings`);
        return results;
    } catch (err) {
        console.error('Error fetching bookings:', err);
        throw err;
    }
};

const getBookingById = async (id) => {
    console.log('Fetching booking details for ID:', id);
    try {
        const [results] = await db.promise().query(
            `SELECT b.*, u.phone_number, GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            WHERE b.id = ?
            GROUP BY b.id`,
            [id]
        );
        console.log(`Booking ${results.length ? 'found' : 'not found'}`);
        return results[0];
    } catch (err) {
        console.error('Error fetching booking:', err);
        throw err;
    }
};

const updateBookingStatus = async (bookingNumber, status) => {
    const sql = 'UPDATE booking SET status = ? WHERE booking_number = ?';
    await db.promise().query(sql, [status, bookingNumber]);
    return true;
};

const completeBooking = async (bookingNumber) => {
    const sql = `
        UPDATE booking 
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE booking_number = ?`;
    
    const [result] = await db.promise().query(sql, [bookingNumber]);
    if (result.affectedRows === 0) {
        throw new Error('Booking tidak ditemukan');
    }
    return true;
};

const deleteBooking = async (id) => {
    console.log('Attempting to delete booking:', id);
    try {
        await db.promise().beginTransaction();
        
        // Delete booking_layanan entries first (karena foreign key)
        await db.promise().query('DELETE FROM booking_layanan WHERE booking_id = ?', [id]);
        
        // Then delete the booking
        const [result] = await db.promise().query('DELETE FROM booking WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await db.promise().rollback();
            throw new Error('Booking not found');
        }

        await db.promise().commit();
        console.log('Booking deleted successfully');
        return true;
    } catch (err) {
        console.error('Failed to delete booking:', err);
        await db.promise().rollback();
        throw err;
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,
    completeBooking
};