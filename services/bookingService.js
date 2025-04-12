const { pool } = require('../db');
const bookingValidationHelper = require('../helpers/bookingValidationHelper');
const { updateHairColorStock, updateSmoothingStock, updateKeratinStock } = require('./stockService');
const { DEFAULT_PRODUCTS } = require('../config/product');

const createBooking = async (data) => {
    const { user_id, layanan_id, tanggal, jam_mulai, hair_color, smoothing_product, keratin_product } = data;

    const connection = await pool.getConnection();
    console.log('Starting booking process...', { user_id, layanan_id, tanggal, jam_mulai });

    let layananWithCategory = null;

    try {
        await connection.beginTransaction();
        console.log('Transaction started');

        // Validate if booking already exists
        const [existingBookings] = await connection.query(
            `SELECT id FROM booking WHERE user_id = ? AND tanggal = ? FOR UPDATE`,
            [user_id, tanggal]
        );

        if (existingBookings.length > 0) {
            console.log('Double booking detected:', existingBookings);
            throw new Error("Anda sudah memiliki booking pada hari ini");
        }

        // Get service details with categories
        console.log('Fetching layanan details...');
        const [layananResults] = await connection.query(
            `SELECT l.*, lk.nama as kategori_nama 
             FROM layanan l 
             JOIN kategori_layanan lk ON l.kategori_id = lk.id 
             WHERE l.id IN (?)`, 
            [layanan_id]
        );
        layananWithCategory = layananResults;

        if (layananWithCategory.length === 0) {
            throw new Error("Layanan tidak ditemukan");
        }
        if (layananWithCategory.length !== layanan_id.length) {
            throw new Error("Beberapa layanan tidak valid");
        }

        // Extract categories
        const categories = layananWithCategory.map(l => l.kategori_nama);
        console.log('Categories to book:', categories);

        // Validate category combinations
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

        // Use default products if necessary
        let total_harga = layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
        let product_detail = {};

        if (categories.includes('Smoothing') && !smoothing_product) {
            console.log('Using default smoothing product');
            const [defaultProduct] = await connection.query(`
                SELECT sp.*, pb.nama as brand_nama
                FROM smoothing_products sp
                JOIN product_brands pb ON sp.brand_id = pb.id
                WHERE sp.id = ? AND sp.brand_id = ?`,
                [DEFAULT_PRODUCTS.smoothing.product_id, DEFAULT_PRODUCTS.smoothing.brand_id]
            );

            if (defaultProduct.length > 0) {
                smoothing_product = DEFAULT_PRODUCTS.smoothing;
                product_detail.smoothing = {
                    nama: defaultProduct[0].nama,
                    jenis: defaultProduct[0].jenis,
                    brand: defaultProduct[0].brand_nama,
                    harga: defaultProduct[0].harga,
                    keterangan: '(Produk default salon)'
                };
                total_harga += parseFloat(defaultProduct[0].harga);
            }
        }

        // Update stock for products
        if (hair_color) {
            console.log('Processing hair color:', hair_color);
            await updateHairColorStock(connection, hair_color);
            console.log('Hair color stock updated');
        }

        if (smoothing_product) {
            await updateSmoothingStock(connection, smoothing_product);
        }

        if (keratin_product) {
            await updateKeratinStock(connection, keratin_product);
        }

        // Additional price calculations for selected products
        if (hair_color) {
            const [colorResult] = await connection.query(
                `SELECT hc.*, hp.harga_dasar 
                 FROM hair_colors hc
                 JOIN hair_products hp ON hc.product_id = hp.id
                 WHERE hc.id = ?`,
                [hair_color.color_id]
            );
            if (!colorResult[0]) throw new Error('Warna tidak ditemukan');
            const totalHargaWarna = parseFloat(colorResult[0].harga_dasar) + parseFloat(colorResult[0].tambahan_harga);
            total_harga += totalHargaWarna;
        }

        if (smoothing_product) {
            const [smoothingResult] = await connection.query(
                'SELECT harga FROM smoothing_products WHERE id = ? AND brand_id = ?',
                [smoothing_product.product_id, smoothing_product.brand_id]
            );
            if (!smoothingResult[0]) throw new Error('Produk smoothing tidak ditemukan');
            total_harga += parseFloat(smoothingResult[0].harga);
        }

        if (keratin_product) {
            const [keratinResult] = await connection.query(
                'SELECT harga FROM keratin_products WHERE id = ? AND brand_id = ?',
                [keratin_product.product_id, keratin_product.brand_id]
            );
            if (!keratinResult[0]) throw new Error('Produk keratin tidak ditemukan');
            total_harga += parseFloat(keratinResult[0].harga);
        }

        const bookingNumber = await bookingHelper.generateBookingNumber();

        // Calculate estimated end time
        const total_estimasi = layananWithCategory.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        const jam_selesai = new Date(`${tanggal} ${jam_mulai}`);
        jam_selesai.setMinutes(jam_selesai.getMinutes() + total_estimasi);
        const jam_selesai_string = jam_selesai.toTimeString().split(' ')[0];
        
        // Insert booking and service relations
        const [insertResult] = await connection.query(
            `INSERT INTO booking (
                user_id, tanggal, jam_mulai, jam_selesai, 
                status, booking_number, total_harga
            ) VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_selesai_string, bookingNumber, total_harga]
        );

        const booking_id = insertResult.insertId;

        // Insert layanan
        await connection.query(
            `INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`,
            [layanan_id.map(id => [booking_id, id])]
        );

        // Insert selected products
        if (hair_color) {
            await connection.query(
                `INSERT INTO booking_colors (booking_id, color_id, brand_id, harga_saat_booking)
                VALUES (?, ?, ?, ?)`,
                [booking_id, hair_color.color_id, hair_color.brand_id, hair_color.harga]
            );
        }

        // Get product details
        if (hair_color) {
            const [colorDetail] = await connection.query(`
                SELECT 
                    hc.nama as warna,
                    hc.kategori,
                    hc.level,
                    hp.nama as nama_produk,
                    hp.jenis,
                    pb.nama as brand,
                    hp.harga_dasar,
                    hc.tambahan_harga,
                    (hp.harga_dasar + hc.tambahan_harga) as total_harga
                FROM hair_colors hc
                JOIN hair_products hp ON hc.product_id = hp.id
                JOIN product_brands pb ON hp.brand_id = pb.id
                WHERE hc.id = ?`,
                [hair_color.color_id]
            );
            product_detail.hair_color = colorDetail[0];
        }

        if (smoothing_product) {
            const [smoothingDetail] = await connection.query(`
                SELECT sp.nama, sp.jenis, pb.nama as brand, sp.harga
                FROM smoothing_products sp
                JOIN product_brands pb ON sp.brand_id = pb.id
                WHERE sp.id = ? AND sp.brand_id = ?`,
                [smoothing_product.product_id, smoothing_product.brand_id]
            );
            product_detail.smoothing = smoothingDetail[0];
        }

        if (keratin_product) {
            const [keratinDetail] = await connection.query(`
                SELECT kp.nama, kp.jenis, pb.nama as brand, kp.harga
                FROM keratin_products kp
                JOIN product_brands pb ON kp.brand_id = pb.id
                WHERE kp.id = ? AND kp.brand_id = ?`,
                [keratin_product.product_id, keratin_product.brand_id]
            );
            product_detail.keratin = keratinDetail[0];
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
            default_products: categories.includes('Smoothing') && !smoothing_product ? true : undefined
        };

    } catch (err) {
        console.error('Error in booking process:', {
            error: err.message,
            kategori: layananWithCategory ? layananWithCategory[0]?.kategori_nama : 'unknown',
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

// Export the necessary functions
module.exports = {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,
    completeBooking
};
