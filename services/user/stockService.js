// File baru untuk pengurangan stok oleh user (booking)
const { pool } = require('../../db');

const reduceHairColorStock = async (color_id, qty = 1, trxConnection = null) => {
  console.log(`[StockService] Mengurangi stok hair_color id=${color_id} qty=${qty}`);
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM hair_colors WHERE id = ? FOR UPDATE',
      [color_id]
    );
    if (!result[0]) throw new Error('Stok hair color tidak ditemukan');
    if (result[0].stok < qty) throw new Error('Stok warna tidak mencukupi');
    await connection.query(
      'UPDATE hair_colors SET stok = stok - ? WHERE id = ?',
      [qty, color_id]
    );
    console.log(`[StockService] Sukses update stok hair_color id=${color_id}`);
  } finally {
    if (ownConnection) connection.release();
  }
};

const reduceSmoothingStock = async (product_id, brand_id, qty = 1, trxConnection = null) => {
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ? FOR UPDATE',
      [product_id, brand_id]
    );
    if (!result[0]) throw new Error('Produk smoothing tidak ditemukan');
    if (result[0].stok < qty) throw new Error('Stok smoothing tidak mencukupi');
    await connection.query(
      'UPDATE smoothing_products SET stok = stok - ? WHERE id = ? AND brand_id = ?',
      [qty, product_id, brand_id]
    );
  } finally {
    if (ownConnection) connection.release();
  }
};

const reduceKeratinStock = async (product_id, brand_id, qty = 1, trxConnection = null) => {
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ? FOR UPDATE',
      [product_id, brand_id]
    );
    if (!result[0]) throw new Error('Produk keratin tidak ditemukan');
    if (result[0].stok < qty) throw new Error('Stok keratin tidak mencukupi');
    await connection.query(
      'UPDATE keratin_products SET stok = stok - ? WHERE id = ? AND brand_id = ?',
      [qty, product_id, brand_id]
    );
  } finally {
    if (ownConnection) connection.release();
  }
};

// Fungsi restore stok untuk mengembalikan stok ketika booking dibatalkan
const restoreHairColorStock = async (color_id, qty = 1, trxConnection = null) => {
  console.log(`[StockService] Restore stok hair_color id=${color_id} qty=${qty}`);
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM hair_colors WHERE id = ? FOR UPDATE',
      [color_id]
    );
    if (!result[0]) throw new Error('Stok hair color tidak ditemukan');
    await connection.query(
      'UPDATE hair_colors SET stok = stok + ? WHERE id = ?',
      [qty, color_id]
    );
    console.log(`[StockService] Sukses restore stok hair_color id=${color_id}`);
  } finally {
    if (ownConnection) connection.release();
  }
};

const restoreSmoothingStock = async (product_id, brand_id, qty = 1, trxConnection = null) => {
  console.log(`[StockService] Restore stok smoothing product_id=${product_id} brand_id=${brand_id} qty=${qty}`);
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ? FOR UPDATE',
      [product_id, brand_id]
    );
    if (!result[0]) throw new Error('Produk smoothing tidak ditemukan');
    await connection.query(
      'UPDATE smoothing_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
      [qty, product_id, brand_id]
    );
    console.log(`[StockService] Sukses restore stok smoothing product_id=${product_id}`);
  } finally {
    if (ownConnection) connection.release();
  }
};

const restoreKeratinStock = async (product_id, brand_id, qty = 1, trxConnection = null) => {
  console.log(`[StockService] Restore stok keratin product_id=${product_id} brand_id=${brand_id} qty=${qty}`);
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;
  try {
    const [result] = await connection.query(
      'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ? FOR UPDATE',
      [product_id, brand_id]
    );
    if (!result[0]) throw new Error('Produk keratin tidak ditemukan');
    await connection.query(
      'UPDATE keratin_products SET stok = stok + ? WHERE id = ? AND brand_id = ?',
      [qty, product_id, brand_id]
    );
    console.log(`[StockService] Sukses restore stok keratin product_id=${product_id}`);
  } finally {
    if (ownConnection) connection.release();
  }
};

// Fungsi untuk restore stok berdasarkan booking_id
const restoreStockByBookingId = async (booking_id, trxConnection = null) => {
  console.log(`[StockService] Restore stok untuk booking_id=${booking_id}`);
  const connection = trxConnection || await pool.getConnection();
  const ownConnection = !trxConnection;

  try {
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
      await restoreHairColorStock(color.color_id, 1, connection);
    }

    // Restore smoothing stock
    for (const smoothing of bookingSmoothing) {
      await restoreSmoothingStock(smoothing.product_id, smoothing.brand_id, 1, connection);
    }

    // Restore keratin stock
    for (const keratin of bookingKeratin) {
      await restoreKeratinStock(keratin.product_id, keratin.brand_id, 1, connection);
    }

    console.log(`[StockService] Berhasil restore semua stok untuk booking_id=${booking_id}`);
  } finally {
    if (ownConnection) connection.release();
  }
};

module.exports = {
  reduceHairColorStock,
  reduceSmoothingStock,
  reduceKeratinStock,
  restoreHairColorStock,
  restoreSmoothingStock,
  restoreKeratinStock,
  restoreStockByBookingId
};
