const productService = require('../../services/admin/productService');
const stockService = require('../../services/admin/stockService');
const { validateProductData, validateStock } = require('../../utils/productUtils');

const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json({
            success: true,
            message: "Data produk berhasil diambil",
            data: products
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Gagal mengambil data produk",
            error: err.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        validateProductData(req.body);
        validateStock(req.body.stok);

        const product = await productService.createProduct(req.body);
        res.status(201).json({
            success: true,
            message: 'Produk berhasil ditambahkan',
            data: product
        });
    } catch (err) {
        res.status(err.name === 'ValidationError' ? 400 : 500).json({
            success: false,
            message: err.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        validateProductData(req.body);
        if (req.body.stok !== undefined) validateStock(req.body.stok);

        const updated = await productService.updateProduct(req.params.id, req.body);
        if (!updated) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

        res.json({ success: true, message: 'Produk berhasil diupdate' });
    } catch (err) {
        res.status(err.name === 'ValidationError' ? 400 : 500).json({
            success: false,
            message: err.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const deleted = await productService.deleteProduct(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

        res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// filepath: /home/hoon/Projects/she_backend/controllers/admin/productController.js
const getProductById = async (req, res) => {
    try {
        const { type, id } = req.params;
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

const updateHairColorStock = async (req, res) => {
    const { color_id, qty } = req.body;
    try {
        validateStock(qty);
        const connection = await require('../../db').pool.getConnection();
        try {
            await connection.beginTransaction();
            // Ambil stok sebelum update & info warna
            const [[before]] = await connection.query(
                `SELECT hc.stok, hc.nama as color_name, hp.nama as product_name, pb.nama as brand_name
                 FROM hair_colors hc
                 JOIN hair_products hp ON hc.product_id = hp.id
                 JOIN product_brands pb ON hp.brand_id = pb.id
                 WHERE hc.id = ?`, [color_id]
            );
            await stockService.updateHairColorStock(connection, { color_id, qty });
            // Ambil stok sesudah update
            const [[after]] = await connection.query(
                `SELECT stok FROM hair_colors WHERE id = ?`, [color_id]
            );
            await connection.commit();
            res.json({
                success: true,
                message: `Stok hair color "${before ? before.color_name : '-'}" (${color_id}) berhasil diupdate`,
                data: {
                    type: 'hair_color',
                    color_id,
                    color_name: before ? before.color_name : null,
                    product_name: before ? before.product_name : null,
                    brand_name: before ? before.brand_name : null,
                    qty_updated: qty,
                    stok_before: before ? before.stok : null,
                    stok_after: after ? after.stok : null
                }
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(err.name === 'ValidationError' ? 400 : 500).json({
            success: false,
            message: err.message
        });
    }
};

const updateSmoothingStock = async (req, res) => {
    const { product_id, brand_id, qty } = req.body;
    try {
        validateStock(qty);
        const connection = await require('../../db').pool.getConnection();
        try {
            await connection.beginTransaction();
            // Ambil stok sebelum update & info produk/brand
            const [[before]] = await connection.query(
                `SELECT sp.stok, sp.nama as product_name, pb.nama as brand_name
                 FROM smoothing_products sp
                 JOIN product_brands pb ON sp.brand_id = pb.id
                 WHERE sp.id = ? AND sp.brand_id = ?`,
                [product_id, brand_id]
            );
            await stockService.updateSmoothingStock(connection, { product_id, brand_id, qty });
            // Ambil stok sesudah update
            const [[after]] = await connection.query(
                `SELECT stok FROM smoothing_products WHERE id = ? AND brand_id = ?`,
                [product_id, brand_id]
            );
            await connection.commit();
            res.json({
                success: true,
                message: `Stok smoothing "${before ? before.product_name : '-'}" (${product_id}) brand "${before ? before.brand_name : '-'}" (${brand_id}) berhasil diupdate`,
                data: {
                    type: 'smoothing',
                    product_id,
                    product_name: before ? before.product_name : null,
                    brand_id,
                    brand_name: before ? before.brand_name : null,
                    qty_updated: qty,
                    stok_before: before ? before.stok : null,
                    stok_after: after ? after.stok : null
                }
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(err.name === 'ValidationError' ? 400 : 500).json({
            success: false,
            message: err.message
        });
    }
};

const updateKeratinStock = async (req, res) => {
    const { product_id, brand_id, qty } = req.body;
    try {
        validateStock(qty);
        const connection = await require('../../db').pool.getConnection();
        try {
            await connection.beginTransaction();
            // Ambil stok sebelum update & info produk/brand
            const [[before]] = await connection.query(
                `SELECT kp.stok, kp.nama as product_name, pb.nama as brand_name
                 FROM keratin_products kp
                 JOIN product_brands pb ON kp.brand_id = pb.id
                 WHERE kp.id = ? AND kp.brand_id = ?`,
                [product_id, brand_id]
            );
            await stockService.updateKeratinStock(connection, { product_id, brand_id, qty });
            // Ambil stok sesudah update
            const [[after]] = await connection.query(
                `SELECT stok FROM keratin_products WHERE id = ? AND brand_id = ?`,
                [product_id, brand_id]
            );
            await connection.commit();
            res.json({
                success: true,
                message: `Stok keratin "${before ? before.product_name : '-'}" (${product_id}) brand "${before ? before.brand_name : '-'}" (${brand_id}) berhasil diupdate`,
                data: {
                    type: 'keratin',
                    product_id,
                    product_name: before ? before.product_name : null,
                    brand_id,
                    brand_name: before ? before.brand_name : null,
                    qty_updated: qty,
                    stok_before: before ? before.stok : null,
                    stok_after: after ? after.stok : null
                }
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(err.name === 'ValidationError' ? 400 : 500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    updateHairColorStock,
    updateSmoothingStock,
    updateKeratinStock
};
