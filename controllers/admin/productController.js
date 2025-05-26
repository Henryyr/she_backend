const productService = require('../../services/admin/productService');
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

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById
};
