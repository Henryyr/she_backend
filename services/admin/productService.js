const { pool } = require('../../db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });
const paginateQuery = require('../../helpers/paginateQuery');

// --- GET ALL ---
const getAllProducts = async () => {
    // Hair products with colors
    const hairProducts = await getAdminHairProducts();
    // Smoothing products
    const smoothingProducts = await getAdminSmoothingProducts();
    // Keratin products
    const keratinProducts = await getAdminKeratinProducts();

    // Flatten hair products by color
    const hairArr = hairProducts.flatMap(item =>
        (item.available_colors && item.available_colors.length > 0)
            ? item.available_colors.map(color => ({
                nama_product: item.product.nama,
                tipe_product: 'hair',
                jenis: item.product.jenis,
                brand: item.brand.nama,
                harga: color.harga_total !== null ? color.harga_total : item.product.harga_dasar,
                stok: color.stok,
                nama_warna: color.nama
            }))
            : [{
                nama_product: item.product.nama,
                tipe_product: 'hair',
                jenis: item.product.jenis,
                brand: item.brand.nama,
                harga: item.product.harga_dasar,
                stok: null,
                nama_warna: null
            }]
    );

    // Smoothing products
    const smoothingArr = smoothingProducts.map(item => ({
        nama_product: item.product.nama,
        tipe_product: 'smoothing',
        jenis: item.product.jenis,
        brand: item.brand.nama,
        harga: item.product.harga,
        stok: item.stok,
        nama_smoothing: item.product.nama // for clarity, can be omitted if redundant
    }));

    // Keratin products
    const keratinArr = keratinProducts.map(item => ({
        nama_product: item.product.nama,
        tipe_product: 'keratin',
        jenis: item.product.jenis,
        brand: item.brand.nama,
        harga: item.product.harga,
        stok: item.stok,
        nama_keratin: item.product.nama // for clarity, can be omitted if redundant
    }));

    // Combine all
    return [
        ...hairArr,
        ...smoothingArr,
        ...keratinArr
    ];
};

const getAllProductsPaginated = async (page = 1, limit = 20) => {
    const connection = await pool;

    // Query untuk hair products + warna
    const hairSql = `
        SELECT 
            hp.id as product_id,
            'hair' as tipe_product,
            hp.nama as nama_product,
            hp.jenis,
            pb.nama as brand,
            (hp.harga_dasar + IFNULL(hc.tambahan_harga,0)) as harga,
            hc.stok,
            hc.nama as nama_warna,
            NULL as nama_smoothing,
            NULL as nama_keratin
        FROM hair_products hp
        JOIN product_brands pb ON hp.brand_id = pb.id
        LEFT JOIN hair_colors hc ON hc.product_id = hp.id
    `;
    const hairCountSql = `
        SELECT COUNT(*) as total
        FROM hair_products hp
        LEFT JOIN hair_colors hc ON hc.product_id = hp.id
    `;

    // Query untuk smoothing
    const smoothingSql = `
        SELECT 
            sp.id as product_id,
            'smoothing' as tipe_product,
            sp.nama as nama_product,
            sp.jenis,
            pb.nama as brand,
            sp.harga,
            sp.stok,
            NULL as nama_warna,
            sp.nama as nama_smoothing,
            NULL as nama_keratin
        FROM smoothing_products sp
        JOIN product_brands pb ON sp.brand_id = pb.id
    `;
    const smoothingCountSql = `SELECT COUNT(*) as total FROM smoothing_products`;

    // Query untuk keratin
    const keratinSql = `
        SELECT 
            kp.id as product_id,
            'keratin' as tipe_product,
            kp.nama as nama_product,
            kp.jenis,
            pb.nama as brand,
            kp.harga,
            kp.stok,
            NULL as nama_warna,
            NULL as nama_smoothing,
            kp.nama as nama_keratin
        FROM keratin_products kp
        JOIN product_brands pb ON kp.brand_id = pb.id
    `;
    const keratinCountSql = `SELECT COUNT(*) as total FROM keratin_products`;

    // Gabungkan semua query dengan UNION ALL
    const unionSql = `
        (${hairSql})
        UNION ALL
        (${smoothingSql})
        UNION ALL
        (${keratinSql})
    `;
    const totalCountSql = `
        SELECT 
            (SELECT COUNT(*) FROM hair_products hp LEFT JOIN hair_colors hc ON hc.product_id = hp.id)
            + (SELECT COUNT(*) FROM smoothing_products)
            + (SELECT COUNT(*) FROM keratin_products)
            AS total
    `;

    // Pagination
    const { data, pagination } = await paginateQuery(
        connection,
        unionSql,
        totalCountSql,
        [],
        [],
        page,
        limit
    );

    return { data, pagination };
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
            sp.stok
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
            kp.stok
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
    getAllProductsPaginated,
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