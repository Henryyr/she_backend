const updateHairColorStock = async (connection, hairColor) => {
    const [result] = await connection.query(
        'SELECT stok FROM hair_colors WHERE id = ?',
        [hairColor.color_id]
    );

    if (!result[0]) throw new Error('Stok hair color tidak ditemukan');
    if (result[0].stok <= 0) {
        throw new Error('Stok warna habis');
    }

    // Deduct stock
    await connection.query(
        'UPDATE hair_colors SET stok = stok - 1 WHERE id = ?',
        [hairColor.color_id]
    );
};

const updateSmoothingStock = async (connection, smoothingProduct) => {
    const [result] = await connection.query(
        'SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ?',
        [smoothingProduct.product_id, smoothingProduct.brand_id]
    );

    if (!result[0]) throw new Error('Produk smoothing tidak ditemukan');
    if (result[0].stok <= 0) {
        throw new Error('Stok smoothing habis');
    }

    // Deduct stock
    await connection.query(
        'UPDATE smoothing_products SET stok = stok - 1 WHERE id = ? AND brand_id = ?',
        [smoothingProduct.product_id, smoothingProduct.brand_id]
    );
};

const updateKeratinStock = async (connection, keratinProduct) => {
    const [result] = await connection.query(
        'SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ?',
        [keratinProduct.product_id, keratinProduct.brand_id]
    );

    if (!result[0]) throw new Error('Produk keratin tidak ditemukan');
    if (result[0].stok <= 0) {
        throw new Error('Stok keratin habis');
    }

    // Deduct stock
    await connection.query(
        'UPDATE keratin_products SET stok = stok - 1 WHERE id = ? AND brand_id = ?',
        [keratinProduct.product_id, keratinProduct.brand_id]
    );
};

module.exports = {
    updateHairColorStock,
    updateSmoothingStock,
    updateKeratinStock
};