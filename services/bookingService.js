const { pool } = require('../db');
const bookingValidationHelper = require('../helpers/bookingValidationHelper');
const stockService = require('./stockService');
const { DEFAULT_PRODUCTS } = require('../config/product');
const { RATE_LIMIT } = require('../config/rateLimit');
const bookingHelper = require('../helpers/bookingHelper');
const { getRandomPromo } = require('../helpers/promoHelper');

const createBooking = async (data) => {
    const { user_id, layanan_id, tanggal, jam_mulai, hair_color } = data;
    let { smoothing_product, keratin_product } = data;
    const layanan_ids = Array.isArray(layanan_id) ? layanan_id : [layanan_id];
    const connection = await pool.getConnection();

    let layananWithCategory = [];

    try {
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
            throw new Error("Anda sudah memiliki booking pada hari ini");
        }

        layananWithCategory = layananResults[0];

        if (layananWithCategory.length === 0) {
            throw new Error("Layanan tidak ditemukan");
        }
        if (layananWithCategory.length !== layanan_ids.length) {
            throw new Error("Beberapa layanan tidak valid");
        }

        const categories = layananWithCategory.map(l => l.kategori_nama);

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

        const [bookingCountRows] = await connection.query(
            `SELECT COUNT(*) as count FROM booking WHERE user_id = ? AND tanggal >= CURDATE() - INTERVAL 3 MONTH`,
            [user_id]
        );
        const bookingCount = bookingCountRows[0]?.count || 0;

        const [lastBookingRows] = await connection.query(
            `SELECT id, promo_discount_percent FROM booking WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [user_id]
        );
        const lastBookingHadPromo = lastBookingRows.length > 0 && lastBookingRows[0].promo_discount_percent > 0;

        let total_harga = layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
        let product_detail = {};

        if (categories.includes('Smoothing') && !smoothing_product) {
            smoothing_product = { ...DEFAULT_PRODUCTS.smoothing };
        }

        if (categories.includes('Keratin') && !keratin_product) {
            keratin_product = { ...DEFAULT_PRODUCTS.keratin };
        }

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

        const { discount_percent, discount_amount } = getRandomPromo(bookingCount, lastBookingHadPromo, total_harga);

        if (discount_percent > 0) {
            total_harga = total_harga - discount_amount;
        }

        const bookingNumber = await bookingHelper.generateBookingNumber();
        const total_estimasi = layananWithCategory.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        const jam_selesai = new Date(`${tanggal} ${jam_mulai}`);
        jam_selesai.setMinutes(jam_selesai.getMinutes() + total_estimasi);
        const jam_selesai_string = jam_selesai.toTimeString().split(' ')[0];

        const [insertResult] = await connection.query(
            `INSERT INTO booking /*+ BATCH_INSERT */ 
            (user_id, tanggal, jam_mulai, jam_selesai, status, booking_number, total_harga, special_request, promo_discount_percent, promo_discount_amount)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_selesai_string, bookingNumber, total_harga, data.special_request, discount_percent, discount_amount]
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

        if (hair_color) {
            await stockService.reduceHairColorStock(hair_color.color_id, 1);
        }
        if (smoothing_product) {
            await stockService.reduceSmoothingStock(smoothing_product.product_id, smoothing_product.brand_id, 1);
        }
        if (keratin_product) {
            await stockService.reduceKeratinStock(keratin_product.product_id, keratin_product.brand_id, 1);
        }

        await connection.commit();

        let cancel_timer = null;
        try {
            const now = new Date();
            const tanggalStr = typeof tanggal === 'string' ? tanggal.split('T')[0] : tanggal;
            const jamStr = jam_mulai.length === 5 ? jam_mulai : jam_mulai.slice(0, 5);
            const startDateTime = new Date(`${tanggalStr}T${jamStr}:00+08:00`);
            const batasCancel = new Date(startDateTime.getTime() + 30 * 60000);
            cancel_timer = Math.max(0, Math.floor((batasCancel.getTime() - now.getTime()) / 1000));
        } catch (e) {
            cancel_timer = null;
        }

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
            default_products: categories.includes('Smoothing') && !smoothing_product ? true : undefined,
            cancel_timer,
            promo: discount_percent > 0 ? {
                discount_percent,
                discount_amount,
                message: `Promo aktif: diskon ${discount_percent}% untuk pelanggan aktif!`
            } : undefined
        };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const getAllBookings = async (page = 1, limit = 10, user_id) => {
    const connection = await pool.getConnection();
    try {
        const offset = (page - 1) * limit;
        const [bookings] = await connection.query(`
            SELECT /*+ INDEX(b idx_booking_created) */ b.*,
                GROUP_CONCAT(l.nama ORDER BY l.id) as layanan_names
            FROM booking b
            LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
            LEFT JOIN layanan l ON bl.layanan_id = l.id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [user_id, limit, offset]);

        const [totalCount] = await connection.query(
            "SELECT COUNT(*) as total FROM booking WHERE user_id = ?",
            [user_id]
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

        let cancel_timer = null;
        try {
            const now = new Date();
            let tanggalStr = booking[0].tanggal;
            if (typeof tanggalStr === 'string' && tanggalStr.includes('T')) {
                tanggalStr = tanggalStr.split('T')[0];
            } else if (tanggalStr instanceof Date) {
                tanggalStr = tanggalStr.toISOString().split('T')[0];
            }
            let jamStr = booking[0].jam_mulai;
            if (typeof jamStr === 'string' && jamStr.length > 5) {
                jamStr = jamStr.slice(0, 5);
            }
            const nowWITA = new Date(now.getTime() + (8 - now.getTimezoneOffset() / 60) * 60 * 60 * 1000 - (now.getTimezoneOffset() * 60 * 1000));
            const startDateTime = new Date(`${tanggalStr}T${jamStr}:00+08:00`);
            const batasCancel = new Date(startDateTime.getTime() + 30 * 60000);
            cancel_timer = Math.max(0, Math.floor((batasCancel.getTime() - nowWITA.getTime()) / 1000));
        } catch (e) {
            cancel_timer = null;
        }

        return {
            ...booking[0],
            cancel_timer
        };
    } catch (error) {
        throw new Error(`Error getting booking: ${error.message}`);
    } finally {
        connection.release();
    }
};

const cancelBooking = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            "UPDATE booking SET status = ? WHERE id = ?",
            ['cancelled', id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Booking tidak ditemukan');
        }
        return { message: 'Booking berhasil dibatalkan', booking_id: id };
    } finally {
        connection.release();
    }
};

module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    cancelBooking
};
