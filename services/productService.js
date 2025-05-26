const { pool } = require('../db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

const getAllProducts = async () => {
    const cacheKey = 'all_products';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    try {
        const [results] = await Promise.all([
            connection.query(`
                (SELECT 
                    hp.id,
                    'hair' as type,
                    hp.nama,
                    hp.jenis,
                    hp.harga_dasar as harga,
                    pb.nama as brand_nama
                FROM hair_products hp
                JOIN product_brands pb ON hp.brand_id = pb.id)
                UNION ALL
                (SELECT 
                    sp.id,
                    'smoothing' as type,
                    sp.nama,
                    sp.jenis,
                    sp.harga,
                    pb.nama as brand_nama
                FROM smoothing_products sp
                JOIN product_brands pb ON sp.brand_id = pb.id)
                UNION ALL
                (SELECT 
                    kp.id,
                    'keratin' as type,
                    kp.nama,
                    kp.jenis,
                    kp.harga,
                    pb.nama as brand_nama
                FROM keratin_products kp
                JOIN product_brands pb ON kp.brand_id = pb.id)
            `)
        ]);

        const groupedResults = {
            hair_products: results[0].filter(p => p.type === 'hair'),
            smoothing_products: results[0].filter(p => p.type === 'smoothing'),
            keratin_products: results[0].filter(p => p.type === 'keratin')
        };

        cache.set(cacheKey, groupedResults);
        return groupedResults;
    } catch (err) {
        console.error('Service Error:', err);
        throw new Error('Gagal mengambil data produk: ' + err.message);
    }
};

const getHairProducts = async () => {
    const cacheKey = 'hair_products';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    try {
        const [products] = await connection.query(`
            SELECT 
                hp.id,
                hp.nama as product_nama,
                hp.jenis,
                hp.deskripsi,
                hp.harga_dasar,
                pb.id as brand_id,
                pb.nama as brand_nama,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'color_id', hc.id,
                        'nama', REPLACE(hc.nama, '"', '\\"'), -- Escape karakter "
                        'kategori', hc.kategori,
                        'level', hc.level,
                        'stok', hc.stok,
                        'tambahan_harga', hc.tambahan_harga
                    )
                ) as colors
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            LEFT JOIN hair_colors hc ON hc.product_id = hp.id AND hc.stok > 0
            GROUP BY hp.id
            ORDER BY pb.nama, hp.nama
        `);

        const formattedProducts = products.map(product => {
            let availableColors = [];
            if (product.colors) {
                try {
                    // Validasi JSON sebelum parsing
                    const jsonString = `[${product.colors}]`;
                    if (!isValidJSON(jsonString)) {
                        throw new Error('Invalid JSON format');
                    }
                    availableColors = JSON.parse(jsonString).map(color => ({
                        ...color,
                        harga_total: parseInt(product.harga_dasar) + parseInt(color.tambahan_harga)
                    }));
                } catch (error) {
                    console.error(`Error parsing colors for product ID ${product.id}:`, error.message);
                }
            }

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
                available_colors: availableColors
            };
        });

        cache.set(cacheKey, formattedProducts);
        return formattedProducts;
    } catch (err) {
        console.error('Service Error:', err);
        throw new Error('Gagal mengambil data produk rambut: ' + err.message);
    }
};

// Helper function untuk validasi JSON
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

const getProductsByCategory = async (kategoriId) => {
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
    try {
        await connection.beginTransaction();

        const [[currentStock]] = await connection.query(
            'SELECT stok FROM hair_colors WHERE id = ? FOR UPDATE',
            [id]
        );

        if (!currentStock) {
            await connection.rollback();
            throw new Error('Warna tidak ditemukan');
        }

        if (stok < 0) {
            await connection.rollback();
            throw new Error('Stok tidak boleh negatif');
        }

        await connection.query(
            'UPDATE hair_colors SET stok = ?, updated_at = NOW() WHERE id = ?',
            [stok, id]
        );

        await connection.commit();
        cache.del('hair_products');
        cache.del('hair_colors');
        return true;
    } catch (err) {
        await connection.rollback();
        throw new Error('Gagal update stok warna: ' + err.message);
    }
};

const updateSmoothingStock = async (id, stok) => {
    const connection = await pool;
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
    const connection = await pool;
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
    const connection = await pool;
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

// Tidak ada createProduct, updateProduct, deleteProduct, getProductById di sini
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