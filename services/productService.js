const db = require('../db');

const getAllProducts = async () => {
    const connection = await db.pool;
    try {
        // Get hair products
        const [hairProducts] = await connection.query(`
            SELECT 
                hp.id,
                'hair' as type,
                hp.nama,
                hp.jenis,
                hp.harga_dasar as harga,
                pb.nama as brand_nama
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
        `);

        // Get smoothing products
        const [smoothingProducts] = await connection.query(`
            SELECT 
                sp.id,
                'smoothing' as type,
                sp.nama,
                sp.jenis,
                sp.harga,
                pb.nama as brand_nama
            FROM smoothing_products sp
            JOIN product_brands pb ON sp.brand_id = pb.id
        `);

        // Get keratin products
        const [keratinProducts] = await connection.query(`
            SELECT 
                kp.id,
                'keratin' as type,
                kp.nama,
                kp.jenis,
                kp.harga,
                pb.nama as brand_nama
            FROM keratin_products kp
            JOIN product_brands pb ON kp.brand_id = pb.id
        `);

        return {
            hair_products: hairProducts,
            smoothing_products: smoothingProducts,
            keratin_products: keratinProducts
        };

    } catch (err) {
        console.error('Service Error:', err);
        throw new Error('Gagal mengambil data produk: ' + err.message);
    }
};

const getHairProducts = async () => {
    const connection = await db.pool;
    try {
        // Get all hair products with their brands
        const [products] = await connection.query(`
            SELECT 
                hp.id,
                hp.nama as product_nama,
                hp.jenis,
                hp.deskripsi,
                hp.harga_dasar,
                pb.id as brand_id,
                pb.nama as brand_nama
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            ORDER BY pb.nama, hp.nama
        `);

        // Get colors for each product
        const productsWithColors = await Promise.all(products.map(async (product) => {
            const [colors] = await connection.query(`
                SELECT 
                    id as color_id,
                    nama,
                    kategori,
                    level,
                    stok,
                    tambahan_harga
                FROM hair_colors 
                WHERE product_id = ? AND stok > 0
                ORDER BY nama
            `, [product.id]);

            return {
                product_id: product.id,
                brand: {
                    id: product.brand_id,
                    nama: product.brand_nama
                },
                product: {
                    nama: product.product_nama,
                    jenis: product.jenis,
                    deskripsi: product.deskripsi,
                    harga_dasar: parseInt(product.harga_dasar)
                },
                available_colors: colors.map(color => ({
                    color_id: color.color_id,
                    nama: color.nama,
                    kategori: color.kategori,
                    level: color.level,
                    stok: color.stok,
                    harga_total: parseInt(product.harga_dasar) + parseInt(color.tambahan_harga)
                }))
            };
        }));

        return productsWithColors;
    } catch (err) {
        console.error('Service Error:', err);
        throw new Error('Gagal mengambil data produk rambut: ' + err.message);
    }
};

const getProductsByCategory = async (kategoriId) => {
    const connection = await db.pool;
    try {
        const [products] = await connection.query(
            `SELECT * FROM products WHERE kategori_id = ?`,
            [kategoriId]
        );
        return products;
    } catch (err) {
        throw new Error('Gagal mengambil data produk: ' + err.message);
    }
};

const updateStock = async (id, stok) => {
    const connection = await db.pool;
    try {
        await connection.query(
            'UPDATE products SET stok = ? WHERE id = ?',
            [stok, id]
        );
        return true;
    } catch (err) {
        throw new Error('Gagal update stok: ' + err.message);
    }
};

const getHairColors = async () => {
    const connection = await db.pool;
    try {
        const [colors] = await connection.query(`
            SELECT 
                hp.id as product_id,
                pb.id as brand_id,
                pb.nama as brand_nama,
                hc.id as color_id,
                hc.nama as warna,
                hc.kategori,
                hc.level,
                hp.harga_dasar,
                hc.tambahan_harga,
                hc.stok
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            JOIN hair_colors hc ON hc.product_id = hp.id
            WHERE hc.stok > 0
            ORDER BY pb.nama, hc.nama
        `);
        return colors;
    } catch (err) {
        throw new Error('Gagal mengambil data warna: ' + err.message);
    }
};

const getSmoothingProducts = async () => {
    const connection = await db.pool;
    try {
        const [products] = await connection.query(`
            SELECT sp.*, pb.nama as brand_nama
            FROM smoothing_products sp
            JOIN product_brands pb ON sp.brand_id = pb.id
            WHERE sp.stok > 0
            ORDER BY pb.nama, sp.nama
        `);
        return products;
    } catch (err) {
        throw new Error('Gagal mengambil data smoothing: ' + err.message);
    }
};

const getKeratinProducts = async () => {
    const connection = await db.pool;
    try {
        const [products] = await connection.query(`
            SELECT kp.*, pb.nama as brand_nama
            FROM keratin_products kp
            JOIN product_brands pb ON kp.brand_id = pb.id
            WHERE kp.stok > 0
            ORDER BY pb.nama, kp.nama
        `);
        return products;
    } catch (err) {
        throw new Error('Gagal mengambil data keratin: ' + err.message);
    }
};

const getHairColorsByProduct = async (productId) => {
    const connection = await db.pool;
    try {
        const [colors] = await connection.query(`
            SELECT 
                hc.id as color_id,
                hc.nama as warna,
                hc.kategori,
                hc.level,
                hc.stok,
                (hp.harga_dasar + hc.tambahan_harga) as total_harga
            FROM hair_colors hc
            JOIN hair_products hp ON hc.product_id = hp.id
            WHERE hc.product_id = ? AND hc.stok > 0
            ORDER BY hc.nama
        `, [productId]);
        return colors;
    } catch (err) {
        throw new Error('Gagal mengambil data warna: ' + err.message);
    }
};

const updateHairColorStock = async (id, stok) => {
    const connection = await db.pool;
    try {
        const [result] = await connection.query(
            'UPDATE hair_colors SET stok = ? WHERE id = ?',
            [stok, id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Warna tidak ditemukan');
        }
        return true;
    } catch (err) {
        throw new Error('Gagal update stok warna: ' + err.message);
    }
};

const updateSmoothingStock = async (id, stok) => {
    const connection = await db.pool;
    try {
        const [result] = await connection.query(
            'UPDATE smoothing_products SET stok = ? WHERE id = ?',
            [stok, id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Produk smoothing tidak ditemukan');
        }
        return true;
    } catch (err) {
        throw new Error('Gagal update stok smoothing: ' + err.message);
    }
};

const updateKeratinStock = async (id, stok) => {
    const connection = await db.pool;
    try {
        const [result] = await connection.query(
            'UPDATE keratin_products SET stok = ? WHERE id = ?',
            [stok, id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Produk keratin tidak ditemukan');
        }
        return true;
    } catch (err) {
        throw new Error('Gagal update stok keratin: ' + err.message);
    }
};

const addHairColor = async (product_id, nama, kategori, level, stok, tambahan_harga) => {
    const connection = await db.pool;
    try {
        const [result] = await connection.query(
            `INSERT INTO hair_colors 
            (product_id, nama, kategori, level, stok, tambahan_harga)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [product_id, nama, kategori, level, stok, tambahan_harga]
        );
        
        return {
            id: result.insertId,
            product_id,
            nama,
            kategori,
            level,
            stok,
            tambahan_harga
        };
    } catch (err) {
        throw new Error('Gagal menambah warna baru: ' + err.message);
    }
};

module.exports = {
    getAllProducts,
    getProductsByCategory,
    updateStock,
    getHairProducts,
    getHairColors,
    getSmoothingProducts,
    getKeratinProducts,
    getHairColorsByProduct,
    updateHairColorStock,
    updateSmoothingStock,
    updateKeratinStock,
    addHairColor
};
