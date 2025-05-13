const { pool } = require('../db');
const bookingValidationHelper = require('../helpers/bookingValidationHelper');
const { updateHairColorStock, updateSmoothingStock, updateKeratinStock } = require('./stockService');
const { DEFAULT_PRODUCTS } = require('../config/product');
const { RATE_LIMIT } = require('../config/rateLimit');
const bookingHelper = require('../helpers/bookingHelper');

const createBooking = async (data) => {
    const { user_id, layanan_id, tanggal, jam_mulai, hair_color } = data;
    let { smoothing_product, keratin_product } = data;

    // Convert single layanan_id to array if it's not already an array
    const layanan_ids = Array.isArray(layanan_id) ? layanan_id : [layanan_id];

    const connection = await pool.getConnection();
    console.log('Starting booking process...', { user_id, layanan_id, tanggal, jam_mulai });

    let layananWithCategory = []; // Define at the top level of the function

    try {
        // Check rate limit with index hint
        const [requests] = await connection.query(
            `SELECT /*+ INDEX(booking idx_user_created) */ COUNT(*) as count 
             FROM booking 
             WHERE user_id = ? 
             AND created_at > NOW() - INTERVAL ? MINUTE`,
            [user_id, process.env.NODE_ENV === 'production' ? 60 : 5]
        );

        if (requests[0].count >= RATE_LIMIT.DATABASE.MAX_REQUESTS) {
            const timeWindow = process.env.NODE_ENV === 'production' ? 'jam' : 'menit';
            throw new Error(`Rate limit: Max ${RATE_LIMIT.DATABASE.MAX_REQUESTS} requests per ${timeWindow}. [DEV MODE]`);
        }

        await connection.beginTransaction();

        // Simple efficient queries with index hints
        const [[existingBookings], layananResults] = await Promise.all([
            connection.query(
                'SELECT /*+ INDEX(booking idx_user_tanggal) */ id FROM booking WHERE user_id = ? AND tanggal = ? FOR UPDATE',
                [user_id, tanggal]
            ),
            connection.query(
                `SELECT /*+ INDEX(l idx_layanan_id) */ l.*, lk.nama as kategori_nama 
                 FROM layanan l 
                 JOIN kategori_layanan lk ON l.kategori_id = lk.id 
                 WHERE l.id IN (?)`, 
                [layanan_ids]
            )
        ]);

        if (existingBookings.length > 0) {
            console.log('Double booking detected:', existingBookings);
            throw new Error("Anda sudah memiliki booking pada hari ini");
        }

        layananWithCategory = layananResults[0]; // Assign the query results

        if (layananWithCategory.length === 0) {
            throw new Error("Layanan tidak ditemukan");
        }
        
        // Modified this check to work with both single layanan_id and arrays
        if (layananWithCategory.length !== layanan_ids.length) {
            throw new Error("Beberapa layanan tidak valid");
        }

        const categories = layananWithCategory.map(l => l.kategori_nama);
        console.log('Categories to book:', categories);

        if (categories.includes('Cat Rambut') && !hair_color) {
            throw new Error('Layanan Cat Rambut membutuhkan pemilihan warna');
        }

        if (bookingValidationHelper.isIncompatibleCombo(categories)) {
            throw new Error('Kombinasi layanan yang dipilih tidak diperbolehkan');
        }

        if (bookingValidationHelper.hasDuplicateCategory(categories)) {
            throw new Error("Tidak bisa booking layanan dari kategori yang sama sekaligus. Silakan booking terpisah.");
        }

        if (bookingValidationHelper.isProductUnnecessary(categories, hair_color, smoothing_product, keratin_product)) {
            throw new Error("Beberapa layanan yang dipilih tidak memerlukan produk tambahan");
        }

        console.log('Valid service categories:', categories);

        let total_harga = layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
        let product_detail = {};

        if (categories.includes('Smoothing') && !smoothing_product) {
            console.log('Using default smoothing product');
            smoothing_product = { ...DEFAULT_PRODUCTS.smoothing };
        }

        if (categories.includes('Keratin') && !keratin_product) {
            console.log('Using default keratin product');
            keratin_product = { ...DEFAULT_PRODUCTS.keratin };
        }

        // Process product details separately for each type
        let productResults = [];

        if (hair_color) {
            const [hairColorResults] = await connection.query(`
                SELECT 'hair_color' as type, hc.*, hp.harga_dasar, pb.nama as brand_nama
                FROM hair_colors hc
                JOIN hair_products hp ON hc.product_id = hp.id
                JOIN product_brands pb ON hp.brand_id = pb.id
                WHERE hc.id = ?
            `, [hair_color.color_id]);
            
            productResults = [...productResults, ...hairColorResults];
        }

        if (smoothing_product) {
            const [smoothingResults] = await connection.query(`
                SELECT 'smoothing' as type, sp.*, pb.nama as brand_nama
                FROM smoothing_products sp
                JOIN product_brands pb ON sp.brand_id = pb.id
                WHERE sp.id = ? AND sp.brand_id = ?
            `, [smoothing_product.product_id, smoothing_product.brand_id]);
            
            productResults = [...productResults, ...smoothingResults];
        }

        if (keratin_product) {
            const [keratinResults] = await connection.query(`
                SELECT 'keratin' as type, kp.*, pb.nama as brand_nama
                FROM keratin_products kp
                JOIN product_brands pb ON kp.brand_id = pb.id
                WHERE kp.id = ? AND kp.brand_id = ?
            `, [keratin_product.product_id, keratin_product.brand_id]);
            
            productResults = [...productResults, ...keratinResults];
        }

        productResults.forEach(result => {
            switch(result.type) {
                case 'hair_color':
                    total_harga += parseFloat(result.harga_dasar) + parseFloat(result.tambahan_harga);
                    product_detail.hair_color = result;
                    break;
                case 'smoothing':
                    total_harga += parseFloat(result.harga);
                    product_detail.smoothing = result;
                    break;
                case 'keratin':
                    total_harga += parseFloat(result.harga);
                    product_detail.keratin = result;
                    break;
            }
        });

        const bookingNumber = await bookingHelper.generateBookingNumber();
        const total_estimasi = layananWithCategory.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        const jam_selesai = new Date(`${tanggal} ${jam_mulai}`);
        jam_selesai.setMinutes(jam_selesai.getMinutes() + total_estimasi);
        const jam_selesai_string = jam_selesai.toTimeString().split(' ')[0];

        const [insertResult] = await connection.query(
            `INSERT INTO booking /*+ BATCH_INSERT */ 
            (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga, special_request)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_selesai_string, bookingNumber, total_harga, data.special_request]
        );

        const booking_id = insertResult.insertId;

        await connection.query(
            `INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`,
            [layanan_ids.map(id => [booking_id, id])]
        );

        if (hair_color) {
            await connection.query(
                `INSERT INTO booking_colors (booking_id, color_id, brand_id, harga_saat_booking)
                VALUES (?, ?, ?, ?)`,
                [booking_id, hair_color.color_id, hair_color.brand_id, product_detail.hair_color ? product_detail.hair_color.tambahan_harga : 0]
            );
        }

        await connection.commit();
        console.log('Booking created successfully:', {
            booking_id,
            booking_number: bookingNumber,
            total_harga,
            kategori: categories.join(', ')
        });

        return {
            booking_id,
            booking_number: bookingNumber,
            total_harga,
            status: 'pending',
            layanan: layananWithCategory.map(l => l.nama).join(' + '),
            kategori: categories.join(' + '),
            tanggal,
            jam_mulai,
            jam_selesai: jam_selesai_string,
            product_detail,
            special_request: data.special_request,
            default_products: categories.includes('Smoothing') && !smoothing_product ? true : undefined
        };

    } catch (err) {
        console.error('Error in booking process:', {
            error: err.message,
            kategori: layananWithCategory.length > 0 ? layananWithCategory[0]?.kategori_nama : 'unknown',
            products: { hair_color, smoothing_product, keratin_product }
        });
        await connection.rollback();
        console.log('Transaction rolled back');
        throw err;
    } finally {
        connection.release();
        console.log('Connection released');
    }
};
const getAllBookings = async (page = 1, limit = 10) => {
    const connection = await pool.getConnection();
    try {
        const offset = (page - 1) * limit;
        const [bookings] = await connection.query(`
            SELECT /*+ INDEX(b idx_booking_created) */ b.*,
                GROUP_CONCAT(l.nama ORDER BY l.id) as layanan_names
            FROM booking b
            LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
            LEFT JOIN layanan l ON bl.layanan_id = l.id
            GROUP BY b.id
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [totalCount] = await connection.query(
            "SELECT COUNT(*) as total FROM booking"
        );

        return {
            bookings,
            pagination: {
                total: totalCount[0].total,
                page,
                limit,
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        };
    } finally {
        connection.release();
    }
};

const getBookingById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [booking] = await connection.query(
            `SELECT 
                b.*, 
                GROUP_CONCAT(l.nama) as layanan_names,
                GROUP_CONCAT(l.id) as layanan_ids
             FROM booking b
             LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
             LEFT JOIN layanan l ON bl.layanan_id = l.id
             WHERE b.id = ?
             GROUP BY b.id`,
            [id]
        );

        if (!booking[0]) {
            throw new Error('Booking tidak ditemukan');
        }

        return booking[0];
    } catch (error) {
        throw new Error(`Error getting booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const updateBookingStatus = async (id, status) => {
    const connection = await pool.getConnection();
    try {
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Status tidak valid');
        }

        const [result] = await connection.query(
            'UPDATE booking SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Booking tidak ditemukan');
        }

        return { message: 'Status booking berhasil diperbarui' };
    } catch (error) {
        throw new Error(`Error updating booking status: ${error.message}`);
    } finally {
        connection.release();
    }
};

const deleteBooking = async (id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [booking] = await connection.query(
            'SELECT status FROM booking WHERE id = ?',
            [id]
        );

        if (!booking[0]) {
            throw new Error('Booking tidak ditemukan');
        }

        if (booking[0].status === 'completed') {
            throw new Error('Tidak dapat menghapus booking yang sudah selesai');
        }

        await connection.query('DELETE FROM booking_layanan WHERE booking_id = ?', [id]);
        await connection.query('DELETE FROM booking_colors WHERE booking_id = ?', [id]);
        
        const [result] = await connection.query('DELETE FROM booking WHERE id = ?', [id]);

        await connection.commit();
        return { message: 'Booking berhasil dihapus' };

    } catch (error) {
        await connection.rollback();
        throw new Error(`Error deleting booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const completeBooking = async (id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get booking details with product information
        const [bookingDetails] = await connection.query(`
            SELECT b.*, 
                   bc.color_id, bc.brand_id as color_brand_id,
                   bs.product_id as smoothing_id, bs.brand_id as smoothing_brand_id,
                   bk.product_id as keratin_id, bk.brand_id as keratin_brand_id
            FROM booking b
            LEFT JOIN booking_colors bc ON b.id = bc.booking_id
            LEFT JOIN booking_smoothing bs ON b.id = bs.booking_id
            LEFT JOIN booking_keratin bk ON b.id = bk.booking_id
            WHERE b.id = ? FOR UPDATE`,
            [id]
        );

        if (!bookingDetails[0]) {
            throw new Error('Booking tidak ditemukan');
        }

        const booking = bookingDetails[0];

        if (booking.status === 'completed') {
            throw new Error('Booking sudah selesai');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Tidak dapat menyelesaikan booking yang sudah dibatalkan');
        }

        // Update stocks based on products used
        const stockUpdates = [];
        
        if (booking.color_id) {
            stockUpdates.push(
                updateHairColorStock(booking.color_id, booking.color_brand_id, -1)
            );
        }

        if (booking.smoothing_id) {
            stockUpdates.push(
                updateSmoothingStock(booking.smoothing_id, booking.smoothing_brand_id, -1)
            );
        }

        if (booking.keratin_id) {
            stockUpdates.push(
                updateKeratinStock(booking.keratin_id, booking.keratin_brand_id, -1)
            );
        }

        // Wait for all stock updates to complete
        await Promise.all(stockUpdates);

        // Update booking status and completed_at
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.query(
            `UPDATE booking 
             SET status = 'completed', 
                 completed_at = ?
             WHERE id = ?`,
            [now, id]
        );

        await connection.commit();
        return { 
            message: 'Booking berhasil diselesaikan',
            booking_id: id,
            completed_at: now
        };

    } catch (error) {
        await connection.rollback();
        throw new Error(`Error completing booking: ${error.message}`);
    } finally {
        connection.release();
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
