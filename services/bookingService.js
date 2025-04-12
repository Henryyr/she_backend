// services/bookingService.js
const db = require('../db');
const bookingHelper = require('../helpers/bookingHelper');

// Update konstanta kategori
const KATEGORI_BUTUH_PRODUK = ['Cat Rambut']; 
const KATEGORI_OPTIONAL_PRODUK = ['Smoothing', 'Keratin']; 
const KATEGORI_TIDAK_PILIH_PRODUK = ['Make Up', 'Facial']; 

// Tambahkan konstanta untuk default products
const DEFAULT_PRODUCTS = {
    smoothing: {
        brand_id: 1,          // Matrix (default brand)
        product_id: 1,        // Matrix Opti Normal (default product)
    },
    keratin: {
        brand_id: 1,          // Matrix
        product_id: 1,        // Matrix Keratin Regular
    }
};

// Helper functions untuk update stok
const updateHairColorStock = async (connection, hair_color) => {
    console.log('Updating hair color stock:', hair_color);
    const [result] = await connection.query(
        'UPDATE hair_colors SET stok = stok - 1 WHERE id = ? AND stok > 0',
        [hair_color.color_id]
    );
    if (result.affectedRows === 0) {
        console.error('Stock update failed:', { hair_color, result });
        throw new Error('Stok warna rambut tidak mencukupi');
    }
    console.log('Stock updated successfully');
};

const updateSmoothingStock = async (connection, smoothing_product) => {
    const [result] = await connection.query(
        'UPDATE smoothing_products SET stok = stok - 1 WHERE id = ? AND brand_id = ? AND stok > 0',
        [smoothing_product.product_id, smoothing_product.brand_id]
    );
    if (result.affectedRows === 0) {
        throw new Error('Stok produk smoothing tidak mencukupi');
    }
};

const updateKeratinStock = async (connection, keratin_product) => {
    const [result] = await connection.query(
        'UPDATE keratin_products SET stok = stok - 1 WHERE id = ? AND brand_id = ? AND stok > 0',
        [keratin_product.product_id, keratin_product.brand_id]
    );
    if (result.affectedRows === 0) {
        throw new Error('Stok produk keratin tidak mencukupi');
    }
};

const createBooking = async (data) => {
    const { user_id, layanan_id, tanggal, jam_mulai, hair_color, smoothing_product, keratin_product } = data;
    const connection = await db.pool.getConnection();
    console.log('Starting booking process...', { user_id, layanan_id, tanggal, jam_mulai });

    let layananWithCategory = null; // Definisikan di luar try block

    try {
        await connection.beginTransaction();
        console.log('Transaction started');

        // Validasi booking yang sudah ada
        const [existingBookings] = await connection.query(
            `SELECT id FROM booking WHERE user_id = ? AND tanggal = ? FOR UPDATE`,
            [user_id, tanggal]
        );

        if (existingBookings.length > 0) {
            console.log('Double booking detected:', existingBookings);
            throw new Error("Anda sudah memiliki booking pada hari ini");
        }

        // Get semua layanan dengan kategorinya
        console.log('Fetching layanan details...');
        const [layananResults] = await connection.query(
            `SELECT l.*, lk.nama as kategori_nama 
             FROM layanan l 
             JOIN kategori_layanan lk ON l.kategori_id = lk.id 
             WHERE l.id IN (?)`, 
            [layanan_id]
        );
        layananWithCategory = layananResults; // Assign hasil query

        // Validasi jumlah layanan yang ditemukan
        if (layananWithCategory.length === 0) {
            throw new Error("Layanan tidak ditemukan");
        }
        if (layananWithCategory.length !== layanan_id.length) {
            throw new Error("Beberapa layanan tidak valid");
        }

        // Cek kategori yang ada
        const categories = layananWithCategory.map(l => l.kategori_nama);
        console.log('Categories to book:', categories);

        // Validasi khusus untuk kombinasi Cat Rambut dan Smoothing
        if (categories.includes('Cat Rambut') && categories.includes('Smoothing')) {
            if (!hair_color) {
                throw new Error("Harus memilih warna rambut untuk layanan cat rambut");
            }
            // smoothing_product opsional
        }
        // Jika hanya Cat Rambut
        else if (categories.includes('Cat Rambut')) {
            if (!hair_color) {
                throw new Error("Harus memilih warna rambut untuk layanan cat rambut");
            }
        }
        // Jika hanya Smoothing
        else if (categories.includes('Smoothing')) {
            // smoothing_product opsional
        }

        console.log('Validated service combinations:', categories);

        // Validasi produk smoothing jika ada
        if (categories.includes('Smoothing') && smoothing_product) {
            if (!smoothing_product) {
                console.log('Smoothing without product (using salon default product)');
            }
        }

        // Validasi produk keratin jika ada
        if (categories.includes('Keratin') && keratin_product) {
            if (!keratin_product) {
                console.log('Keratin without product (using salon default product)');
            }
        }

        // Validasi produk untuk kategori yang tidak perlu produk
        const hasUnnecessaryProduct = categories.some(cat => 
            KATEGORI_TIDAK_PILIH_PRODUK.includes(cat)
        );

        if (hasUnnecessaryProduct && (hair_color || smoothing_product || keratin_product)) {
            throw new Error("Beberapa layanan yang dipilih tidak memerlukan produk tambahan");
        }

        // Cek kategori yang duplikat (tetap dilarang)
        const uniqueCategories = [...new Set(categories)];
        
        if (categories.length !== uniqueCategories.length) {
            console.error('Duplicate categories detected:', categories);
            throw new Error("Tidak bisa booking layanan dari kategori yang sama sekaligus. Silakan booking terpisah.");
        }

        // Tapi kombinasi kategori berbeda diperbolehkan
        console.log('Valid service categories:', uniqueCategories);

        // Cek kombinasi kategori yang tidak diperbolehkan
        const hasIncompatibleServices = (categories) => {
            // Hanya kombinasi yang benar-benar tidak boleh
            const incompatiblePairs = [
                ['Smoothing', 'Keratin']  // Hapus validasi Cat Rambut
            ];

            return incompatiblePairs.some(([cat1, cat2]) => 
                categories.includes(cat1) && categories.includes(cat2)
            );
        };

        if (hasIncompatibleServices(categories)) {
            throw new Error("Kombinasi layanan yang dipilih tidak diperbolehkan");
        }

        console.log('Validated service categories:', uniqueCategories);

        if (layananWithCategory.length === 0) {
            throw new Error("Layanan tidak ditemukan");
        }

        // Jika ada layanan smoothing tapi tidak ada product yang dipilih, gunakan default
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

        // Jika ada layanan keratin tapi tidak ada product yang dipilih, gunakan default
        if (categories.includes('Keratin') && !keratin_product) {
            console.log('Using default keratin product');
            const [defaultProduct] = await connection.query(`
                SELECT kp.*, pb.nama as brand_nama
                FROM keratin_products kp
                JOIN product_brands pb ON kp.brand_id = pb.id
                WHERE kp.id = ? AND kp.brand_id = ?`,
                [DEFAULT_PRODUCTS.keratin.product_id, DEFAULT_PRODUCTS.keratin.brand_id]
            );

            if (defaultProduct.length > 0) {
                keratin_product = DEFAULT_PRODUCTS.keratin;
                product_detail.keratin = {
                    nama: defaultProduct[0].nama,
                    jenis: defaultProduct[0].jenis,
                    brand: defaultProduct[0].brand_nama,
                    harga: defaultProduct[0].harga
                };
                total_harga += parseFloat(defaultProduct[0].harga);
            }
        }

        // Update stok sesuai kategori
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

        // Hitung total harga
        let total_harga = layananWithCategory.reduce((sum, l) => sum + parseFloat(l.harga), 0);
        
        // Tambah harga produk jika ada
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

        // Hitung jam selesai berdasarkan estimasi waktu layanan
        const total_estimasi = layananWithCategory.reduce((sum, l) => sum + l.estimasi_waktu, 0);
        const jam_selesai = new Date(`${tanggal} ${jam_mulai}`);
        jam_selesai.setMinutes(jam_selesai.getMinutes() + total_estimasi);
        const jam_selesai_string = jam_selesai.toTimeString().split(' ')[0];
        
        // Insert booking dengan jam_selesai
        const [insertResult] = await connection.query(
            `INSERT INTO booking (
                user_id, tanggal, jam_mulai, jam_selesai, 
                status, booking_number, total_harga
            ) VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
            [user_id, tanggal, jam_mulai, jam_selesai_string, bookingNumber, total_harga]
        );

        const booking_id = insertResult.insertId;

        // Insert relasi booking_layanan
        await connection.query(
            `INSERT INTO booking_layanan (booking_id, layanan_id) VALUES ?`,
            [layanan_id.map(id => [booking_id, id])]
        );

        // Insert produk yang dipilih ke tabel relasi yang sesuai
        if (hair_color) {
            await connection.query(
                `INSERT INTO booking_colors (booking_id, color_id, brand_id, harga_saat_booking)
                VALUES (?, ?, ?, ?)`,
                [booking_id, hair_color.color_id, hair_color.brand_id, hair_color.harga]
            );
        }

        // Get detail produk yang dipilih
        let product_detail = {};
        
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

const getAllBookings = async (page, limit) => {
    const connection = await db.pool.getConnection();
    console.log(`Fetching bookings (page: ${page}, limit: ${limit})`);
    try {
        const [results] = await connection.query(
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
    } finally {
        connection.release();
    }
};

const getBookingById = async (id) => {
    const connection = await db.pool.getConnection();
    console.log('Fetching booking details for ID:', id);
    try {
        const [results] = await connection.query(
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
    } finally {
        connection.release();
    }
};

const updateBookingStatus = async (bookingNumber, status) => {
    const connection = await db.pool.getConnection();
    try {
        const sql = 'UPDATE booking SET status = ? WHERE booking_number = ?';
        await connection.query(sql, [status, bookingNumber]);
        return true;
    } finally {
        connection.release();
    }
};

const completeBooking = async (bookingNumber) => {
    const connection = await db.pool.getConnection();
    try {
        const sql = `
            UPDATE booking 
            SET 
                status = 'completed',
                completed_at = NOW()
            WHERE booking_number = ?`;
        
        const [result] = await connection.query(sql, [bookingNumber]);
        if (result.affectedRows === 0) {
            throw new Error('Booking tidak ditemukan');
        }
        return true;
    } finally {
        connection.release();
    }
};

const deleteBooking = async (id) => {
    const connection = await db.pool.getConnection();
    console.log('Attempting to delete booking:', id);
    try {
        await connection.beginTransaction();

        // Delete related testimonials first
        await connection.query('DELETE FROM testimoni WHERE booking_id = ?', [id]);

        // Delete related transactions
        await connection.query('DELETE FROM transaksi WHERE booking_id = ?', [id]);

        // Delete booking_layanan entries
        await connection.query('DELETE FROM booking_layanan WHERE booking_id = ?', [id]);

        // Then delete the booking
        const [result] = await connection.query('DELETE FROM booking WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new Error('Booking not found');
        }

        await connection.commit();
        console.log('Booking deleted successfully');
        return { message: "Booking dan semua data terkait berhasil dihapus" };
    } catch (err) {
        console.error('Failed to delete booking:', err);
        await connection.rollback();
        throw {
            status: 500,
            message: "Gagal menghapus booking",
            details: err.message
        };
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