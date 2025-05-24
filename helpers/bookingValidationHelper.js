const db = require('../db');

const KATEGORI_DEFAULT_PRODUK = ['Smoothing', 'Keratin'];
const KATEGORI_WAJIB_PRODUK = {
    'Cat Rambut': ['hair_color']
};

const isProductUnnecessary = (categories, hair_color, smoothing_product, keratin_product) => {
    const productValues = {
        hair_color,
        smoothing_product,
        keratin_product
    };

    for (const category of categories) {
        if (KATEGORI_DEFAULT_PRODUK.includes(category)) {
            continue;
        }
        
        const requiredProducts = KATEGORI_WAJIB_PRODUK[category];
        if (requiredProducts) {
            for (const product of requiredProducts) {
                if (!productValues[product]) {
                    throw new Error(`Layanan ${category} membutuhkan pemilihan produk`);
                }
            }
        }
    }
    return false;
};

const isIncompatibleCombo = (categories) => {
    const incompatiblePairs = [
        ['Smoothing', 'Keratin']
    ];

    return incompatiblePairs.some(([cat1, cat2]) => 
        categories.includes(cat1) && categories.includes(cat2)
    );
};

const hasDuplicateCategory = (categories) => {
    const categoryCount = {};
    
    for (const category of categories) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        // If any category appears more than once, return true
        if (categoryCount[category] > 1) {
            return true;
        }
    }
    return false;
};

// Validasi jam booking untuk mencegah double booking pada hari dan jam yang sama (overlap)
const validateBookingTime = async (tanggal, jam_mulai, estimasi_waktu, user_id = null, booking_id = null) => {
    try {
        let sql = `
            SELECT booking_number, jam_mulai, jam_selesai, u.username as user_name
            FROM booking b
            JOIN users u ON b.user_id = u.id
            WHERE b.tanggal = ? 
            AND b.status NOT IN ('canceled', 'completed')
        `;
        
        const params = [tanggal];
        
        // Jika untuk update booking, exclude booking yang sedang diupdate
        if (booking_id) {
            sql += ' AND b.id != ?';
            params.push(booking_id);
        }
        
        // Jika untuk user tertentu, bisa tambahkan filter user
        if (user_id) {
            sql += ' AND b.user_id != ?';
            params.push(user_id);
        }

        const [results] = await db.pool.query(sql, params);

        // Hitung jam selesai booking baru
        function toMinutes(timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        }
        const startMinutes = toMinutes(jam_mulai);
        const endMinutes = startMinutes + estimasi_waktu;

        for (const booking of results) {
            const bStart = toMinutes(booking.jam_mulai.length === 5 ? booking.jam_mulai : booking.jam_mulai.slice(0, 5));
            const bEnd = toMinutes(booking.jam_selesai.length === 5 ? booking.jam_selesai : booking.jam_selesai.slice(0, 5));
            // Cek overlap
            if (startMinutes < bEnd && endMinutes > bStart) {
                throw new Error(
                    `Jam ${jam_mulai} - ${new Date(0,0,0,0,startMinutes+estimasi_waktu).toTimeString().slice(0,5)} pada tanggal ${tanggal} bentrok dengan booking ${booking.user_name} (${booking.booking_number}) dari jam ${booking.jam_mulai} sampai ${booking.jam_selesai}.`
                );
            }
        }
        return true;
    } catch (error) {
        throw error;
    }
};

// Validasi untuk mencegah user booking lebih dari 1x di hari yang sama
const validateUserDailyBooking = async (tanggal, user_id, booking_id = null) => {
    try {
        let sql = `
            SELECT booking_number, jam_mulai
            FROM booking 
            WHERE tanggal = ? 
            AND user_id = ? 
            AND status NOT IN ('canceled', 'completed')
        `;
        
        const params = [tanggal, user_id];
        
        // Jika untuk update booking, exclude booking yang sedang diupdate
        if (booking_id) {
            sql += ' AND id != ?';
            params.push(booking_id);
        }

        const [results] = await db.pool.query(sql, params);
        
        if (results.length > 0) {
            const existingBooking = results[0];
            throw new Error(
                `Anda sudah memiliki booking pada tanggal ${tanggal} jam ${existingBooking.jam_mulai} (${existingBooking.booking_number}). Satu user hanya dapat booking 1x per hari.`
            );
        }
        
        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    isIncompatibleCombo,
    hasDuplicateCategory,
    isProductUnnecessary,
    validateBookingTime,
    validateUserDailyBooking
};