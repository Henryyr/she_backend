const db = require('../db');

const KATEGORI_WAJIB_PRODUK = {
  'Cat Rambut': ['hair_color'],
  Smoothing: ['smoothing_product'],
  Keratin: ['keratin_product']
};

const isProductUnnecessary = (categories, hair_color, smoothing_product, keratin_product) => {
  const productValues = {
    hair_color,
    smoothing_product,
    keratin_product
  };

  // Produk yang wajib diisi sesuai kategori
  for (const category of categories) {
    const requiredProducts = KATEGORI_WAJIB_PRODUK[category];
    if (requiredProducts) {
      for (const product of requiredProducts) {
        if (!productValues[product]) {
          throw new Error(`Layanan ${category} membutuhkan pemilihan produk`);
        }
      }
    }
  }

  // Tidak boleh ada produk yang diisi jika kategorinya tidak dipilih
  if (!categories.includes('Cat Rambut') && hair_color) {
    throw new Error('Produk hair_color hanya boleh diisi jika memilih layanan Cat Rambut');
  }
  if (!categories.includes('Smoothing') && smoothing_product) {
    throw new Error('Produk smoothing_product hanya boleh diisi jika memilih layanan Smoothing');
  }
  if (!categories.includes('Keratin') && keratin_product) {
    throw new Error('Produk keratin_product hanya boleh diisi jika memilih layanan Keratin');
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

// Validasi jam booking untuk mencegah double booking pada hari dan jam yang sama
const validateBookingTime = async (tanggal, jam_mulai, user_id = null, booking_id = null) => {
  let sql = `
            SELECT booking_number, jam_mulai, u.username as user_name
            FROM booking b
            JOIN users u ON b.user_id = u.id
            WHERE b.tanggal = ? 
            AND b.jam_mulai = ? 
            AND b.status NOT IN ('canceled', 'completed')
        `;

  const params = [tanggal, jam_mulai];

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

  if (results.length > 0) {
    const existingBooking = results[0];
    throw new Error(
                `Jam ${jam_mulai} pada tanggal ${tanggal} sudah dibooking oleh ${existingBooking.user_name} (${existingBooking.booking_number}). Silakan pilih jam lain.`
    );
  }

  return true;
};

// Validasi untuk mencegah user booking lebih dari 1x di hari yang sama
const validateUserDailyBooking = async (tanggal, user_id, booking_id = null) => {
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
};

module.exports = {
  isIncompatibleCombo,
  hasDuplicateCategory,
  isProductUnnecessary,
  validateBookingTime,
  validateUserDailyBooking
};
