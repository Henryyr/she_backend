const { pool } = require('../../db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

// --- GET ALL ---
const getAllProducts = async () => {
    const cacheKey = 'admin_all_products';
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
        throw new Error('Gagal mengambil data produk: ' + err.message);
    }
};

const getProductById = async (req, res) => {
    try {
        const { type, id } = req.params; // type: 'hair', 'smoothing', 'keratin'
        let product;

        if (type === 'hair') {
            product = await productService.getHairProductById(id);
        } else if (type === 'smoothing') {
            product = await productService.getSmoothingProductById(id);
        } else if (type === 'keratin') {
            product = await productService.getKeratinProductById(id);
        } else {
            return res.status(400).json({ success: false, message: 'Tipe produk tidak valid' });
        }

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }

        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getHairProducts = async () => {
    const cacheKey = 'admin_hair_products';
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
                        'nama', REPLACE(hc.nama, '"', '\\"'),
                        'kategori', hc.kategori,
                        'level', hc.level,
                        'stok', hc.stok,
                        'tambahan_harga', hc.tambahan_harga
                    )
                ) as colors
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            LEFT JOIN hair_colors hc ON hc.product_id = hp.id
            GROUP BY hp.id
            ORDER BY pb.nama, hp.nama
        `);

        const formattedProducts = products.map(product => {
            let availableColors = [];
            if (product.colors) {
                try {
                    const jsonString = `[${product.colors}]`;
                    availableColors = JSON.parse(jsonString).map(color => ({
                        ...color,
                        harga_total: parseInt(product.harga_dasar) + parseInt(color.tambahan_harga)
                    }));
                } catch (error) {
                    // skip error
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
        throw new Error('Gagal mengambil data produk rambut: ' + err.message);
    }
};

const getHairProductById = async (id) => {
    const connection = await pool;
    try {
        const [products] = await connection.query(
            `SELECT * FROM hair_products WHERE id = ?`,
            [id]
        );
        return products[0] || null;
    } catch (err) {
        throw new Error('Gagal mengambil produk rambut: ' + err.message);
    }
};

const getSmoothingProducts = async () => {
    const cacheKey = 'admin_smoothing_products';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    try {
        const [products] = await connection.query(`
            SELECT sp.*, pb.nama as brand_nama
            FROM smoothing_products sp
            JOIN product_brands pb ON sp.brand_id = pb.id
            ORDER BY pb.nama, sp.nama
        `);
        cache.set(cacheKey, products);
        return products;
    } catch (err) {
        throw new Error('Gagal mengambil data smoothing: ' + err.message);
    }
};

const getSmoothingProductById = async (id) => {
    const connection = await pool;
    try {
        const [products] = await connection.query(
            `SELECT * FROM smoothing_products WHERE id = ?`,
            [id]
        );
        return products[0] || null;
    } catch (err) {
        throw new Error('Gagal mengambil produk smoothing: ' + err.message);
    }
};

const getKeratinProducts = async () => {
    const cacheKey = 'admin_keratin_products';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    try {
        const [products] = await connection.query(`
            SELECT kp.*, pb.nama as brand_nama
            FROM keratin_products kp
            JOIN product_brands pb ON kp.brand_id = pb.id
            ORDER BY pb.nama, kp.nama
        `);
        cache.set(cacheKey, products);
        return products;
    } catch (err) {
        throw new Error('Gagal mengambil data keratin: ' + err.message);
    }
};

const getKeratinProductById = async (id) => {
    const connection = await pool;
    try {
        const [products] = await connection.query(
            `SELECT * FROM keratin_products WHERE id = ?`,
            [id]
        );
        return products[0] || null;
    } catch (err) {
        throw new Error('Gagal mengambil produk keratin: ' + err.message);
    }
};

// --- CRUD HAIR ---
const createHairProduct = async (data) => {
    const connection = await pool;
    const [result] = await connection.query(
        `INSERT INTO hair_products (nama, jenis, deskripsi, harga_dasar, brand_id) VALUES (?, ?, ?, ?, ?)`,
        [data.nama, data.jenis, data.deskripsi, data.harga_dasar, data.brand_id]
    );
    cache.flushAll();
    return { id: result.insertId, ...data };
};

const updateHairProduct = async (id, data) => {
    const connection = await pool;
    const fields = [];
    const values = [];
    ['nama', 'jenis', 'deskripsi', 'harga_dasar', 'brand_id'].forEach(field => {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    });
    if (fields.length === 0) return false;
    values.push(id);
    const [result] = await connection.query(
        `UPDATE hair_products SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

const deleteHairProduct = async (id) => {
    const connection = await pool;
    const [result] = await connection.query(
        'DELETE FROM hair_products WHERE id = ?',
        [id]
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

// --- CRUD SMOOTHING ---
const createSmoothingProduct = async (data) => {
    const connection = await pool;
    const [result] = await connection.query(
        `INSERT INTO smoothing_products (nama, jenis, harga, stok, brand_id) VALUES (?, ?, ?, ?, ?)`,
        [data.nama, data.jenis, data.harga, data.stok, data.brand_id]
    );
    cache.flushAll();
    return { id: result.insertId, ...data };
};

const updateSmoothingProduct = async (id, data) => {
    const connection = await pool;
    const fields = [];
    const values = [];
    ['nama', 'jenis', 'harga', 'stok', 'brand_id'].forEach(field => {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    });
    if (fields.length === 0) return false;
    values.push(id);
    const [result] = await connection.query(
        `UPDATE smoothing_products SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

const deleteSmoothingProduct = async (id) => {
    const connection = await pool;
    const [result] = await connection.query(
        'DELETE FROM smoothing_products WHERE id = ?',
        [id]
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

// --- CRUD KERATIN ---
const createKeratinProduct = async (data) => {
    const connection = await pool;
    const [result] = await connection.query(
        `INSERT INTO keratin_products (nama, jenis, harga, stok, brand_id) VALUES (?, ?, ?, ?, ?)`,
        [data.nama, data.jenis, data.harga, data.stok, data.brand_id]
    );
    cache.flushAll();
    return { id: result.insertId, ...data };
};

const updateKeratinProduct = async (id, data) => {
    const connection = await pool;
    const fields = [];
    const values = [];
    ['nama', 'jenis', 'harga', 'stok', 'brand_id'].forEach(field => {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    });
    if (fields.length === 0) return false;
    values.push(id);
    const [result] = await connection.query(
        `UPDATE keratin_products SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

const deleteKeratinProduct = async (id) => {
    const connection = await pool;
    const [result] = await connection.query(
        'DELETE FROM keratin_products WHERE id = ?',
        [id]
    );
    cache.flushAll();
    return result.affectedRows > 0;
};

const getAdminHairProducts = async () => {
    const cacheKey = 'admin_hair_products_full';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    // Ambil produk hair
    const [products] = await connection.query(`
        SELECT 
            hp.id as product_id,
            pb.id as brand_id,
            pb.nama as brand_nama,
            hp.nama as product_nama,
            hp.jenis,
            hp.deskripsi,
            hp.harga_dasar
        FROM hair_products hp
        JOIN product_brands pb ON hp.brand_id = pb.id
        ORDER BY pb.nama, hp.nama
    `);

    // Ambil semua warna hair color
    const [colors] = await connection.query(`
        SELECT 
            hc.id as color_id,
            hc.product_id,
            hc.nama,
            hc.kategori,
            hc.level,
            hc.stok,
            hc.tambahan_harga
        FROM hair_colors hc
    `);

    // Gabungkan warna ke masing-masing produk
    const data = products.map(product => {
        const available_colors = colors
            .filter(c => c.product_id === product.product_id)
            .map(color => ({
                nama: color.nama,
                stok: color.stok !== null ? Number(color.stok) : null,
                level: color.level,
                color_id: color.color_id !== null ? Number(color.color_id) : null,
                kategori: color.kategori,
                tambahan_harga: color.tambahan_harga !== null ? Number(color.tambahan_harga) : null,
                harga_total: color.tambahan_harga !== null && product.harga_dasar !== null
                    ? Number(product.harga_dasar) + Number(color.tambahan_harga)
                    : null
            }));

        return {
            product_id: product.product_id,
            brand: {
                id: product.brand_id,
                nama: product.brand_nama
            },
            product: {
                nama: product.product_nama,
                jenis: product.jenis,
                deskripsi: product.deskripsi,
                harga_dasar: Number(product.harga_dasar)
            },
            available_colors
        };
    });

    cache.set(cacheKey, data);
    return data;
};

const getAdminSmoothingProducts = async () => {
    const cacheKey = 'admin_smoothing_products_full';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    const [products] = await connection.query(`
        SELECT 
            sp.id as product_id,
            pb.id as brand_id,
            pb.nama as brand_nama,
            sp.nama as product_nama,
            sp.jenis,
            sp.harga,
            sp.stok,
            sp.deskripsi
        FROM smoothing_products sp
        JOIN product_brands pb ON sp.brand_id = pb.id
        ORDER BY pb.nama, sp.nama
    `);

    const data = products.map(product => ({
        product_id: product.product_id,
        brand: {
            id: product.brand_id,
            nama: product.brand_nama
        },
        product: {
            nama: product.product_nama,
            jenis: product.jenis,
            deskripsi: product.deskripsi,
            harga: Number(product.harga)
        },
        stok: Number(product.stok)
    }));

    cache.set(cacheKey, data);
    return data;
};

const getAdminKeratinProducts = async () => {
    const cacheKey = 'admin_keratin_products_full';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const connection = await pool;
    const [products] = await connection.query(`
        SELECT 
            kp.id as product_id,
            pb.id as brand_id,
            pb.nama as brand_nama,
            kp.nama as product_nama,
            kp.jenis,
            kp.harga,
            kp.stok,
            kp.deskripsi
        FROM keratin_products kp
        JOIN product_brands pb ON kp.brand_id = pb.id
        ORDER BY pb.nama, kp.nama
    `);

    const data = products.map(product => ({
        product_id: product.product_id,
        brand: {
            id: product.brand_id,
            nama: product.brand_nama
        },
        product: {
            nama: product.product_nama,
            jenis: product.jenis,
            deskripsi: product.deskripsi,
            harga: Number(product.harga)
        },
        stok: Number(product.stok)
    }));

    cache.set(cacheKey, data);
    return data;
};

module.exports = {
    // GET ALL
    getAllProducts,
    getProductById,
    getHairProducts,
    getSmoothingProducts,
    getKeratinProducts,
    getHairProductById,
    getSmoothingProductById,
    getKeratinProductById,
    // CRUD HAIR
    createHairProduct,
    updateHairProduct,
    deleteHairProduct,
    // CRUD SMOOTHING
    createSmoothingProduct,
    updateSmoothingProduct,
    deleteSmoothingProduct,
    // CRUD KERATIN
    createKeratinProduct,
    updateKeratinProduct,
    deleteKeratinProduct,
    // ADMIN GET
    getAdminHairProducts,
    getAdminSmoothingProducts,
    getAdminKeratinProducts
};