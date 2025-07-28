const updateHairColorStock = async (connection, hairColor) => {
  const [result] = await connection.query(
    'SELECT stok FROM hair_colors WHERE id = ?',
    [hairColor.color_id]
  );

  if (!result[0]) throw new Error('Stok hair color tidak ditemukan');
  // Tambah stok
  await connection.query(
    'UPDATE hair_colors SET stok = stok + ? WHERE id = ?',
    [hairColor.qty, hairColor.color_id]
  );
};

const updateSmoothingStock = async (connection, smoothingProduct) => {
  const [result] = await connection.query(
    'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ?',
    [smoothingProduct.product_id, smoothingProduct.brand_id]
  );

  if (!result[0]) throw new Error('Produk smoothing tidak ditemukan');
  // Tambah stok
  await connection.query(
    'UPDATE smoothing_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
    [smoothingProduct.qty, smoothingProduct.product_id, smoothingProduct.brand_id]
  );
};

const updateKeratinStock = async (connection, keratinProduct) => {
  const [result] = await connection.query(
    'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ?',
    [keratinProduct.product_id, keratinProduct.brand_id]
  );

  if (!result[0]) throw new Error('Produk keratin tidak ditemukan');
  // Tambah stok
  await connection.query(
    'UPDATE keratin_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
    [keratinProduct.qty, keratinProduct.product_id, keratinProduct.brand_id]
  );
};

// Fungsi restore stok untuk admin
const restoreHairColorStock = async (connection, color_id, qty = 1) => {
  console.log(`[AdminStockService] Restore stok hair_color id=${color_id} qty=${qty}`);
  const [result] = await connection.query(
    'SELECT stok FROM hair_colors WHERE id = ? FOR UPDATE',
    [color_id]
  );
  if (!result[0]) throw new Error('Stok hair color tidak ditemukan');
  await connection.query(
    'UPDATE hair_colors SET stok = stok + ? WHERE id = ?',
    [qty, color_id]
  );
  console.log(`[AdminStockService] Sukses restore stok hair_color id=${color_id}`);
};

const restoreSmoothingStock = async (connection, product_id, brand_id, qty = 1) => {
  console.log(`[AdminStockService] Restore stok smoothing product_id=${product_id} brand_id=${brand_id} qty=${qty}`);
  const [result] = await connection.query(
    'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ? FOR UPDATE',
    [product_id, brand_id]
  );
  if (!result[0]) throw new Error('Produk smoothing tidak ditemukan');
  await connection.query(
    'UPDATE smoothing_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
    [qty, product_id, brand_id]
  );
  console.log(`[AdminStockService] Sukses restore stok smoothing product_id=${product_id}`);
};

const restoreKeratinStock = async (connection, product_id, brand_id, qty = 1) => {
  console.log(`[AdminStockService] Restore stok keratin product_id=${product_id} brand_id=${brand_id} qty=${qty}`);
  const [result] = await connection.query(
    'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ? FOR UPDATE',
    [product_id, brand_id]
  );
  if (!result[0]) throw new Error('Produk keratin tidak ditemukan');
  await connection.query(
    'UPDATE keratin_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
    [qty, product_id, brand_id]
  );
  console.log(`[AdminStockService] Sukses restore stok keratin product_id=${product_id}`);
};

// Fungsi untuk restore stok berdasarkan booking_id (admin)
const restoreStockByBookingId = async (booking_id, connection) => {
  console.log(`[AdminStockService] Restore stok untuk booking_id=${booking_id}`);

  // Ambil data booking colors
  const [bookingColors] = await connection.query(
    'SELECT color_id, brand_id FROM booking_colors WHERE booking_id = ?',
    [booking_id]
  );

  // Ambil data booking smoothing
  const [bookingSmoothing] = await connection.query(
    'SELECT smoothing_id as product_id, brand_id FROM booking_smoothing WHERE booking_id = ?',
    [booking_id]
  );

  // Ambil data booking keratin
  const [bookingKeratin] = await connection.query(
    'SELECT keratin_id as product_id, brand_id FROM booking_keratin WHERE booking_id = ?',
    [booking_id]
  );

  // Restore hair color stock
  for (const color of bookingColors) {
    await restoreHairColorStock(connection, color.color_id, 1);
  }

  // Restore smoothing stock
  for (const smoothing of bookingSmoothing) {
    await restoreSmoothingStock(connection, smoothing.product_id, smoothing.brand_id, 1);
  }

  // Restore keratin stock
  for (const keratin of bookingKeratin) {
    await restoreKeratinStock(connection, keratin.product_id, keratin.brand_id, 1);
  }

  console.log(`[AdminStockService] Berhasil restore semua stok untuk booking_id=${booking_id}`);
};

module.exports = {
  updateHairColorStock,
  updateSmoothingStock,
  updateKeratinStock,
  restoreHairColorStock,
  restoreSmoothingStock,
  restoreKeratinStock,
  restoreStockByBookingId
};
