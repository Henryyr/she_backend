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

module.exports = {
  reduceHairColorStock,
  reduceSmoothingStock,
  reduceKeratinStock
};
