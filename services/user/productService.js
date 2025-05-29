const { pool } = require('../../db');
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
                    // Langsung parse tanpa validasi JSON helper
                    const jsonString = `[${product.colors}]`;
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

module.exports = {
    getAllProducts,
    getProductsByCategory,
    getHairProducts,
    getHairColors,
    getSmoothingProducts,
    getKeratinProducts,
    getHairColorsByProduct,
};