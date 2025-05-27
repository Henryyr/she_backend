const productService = require('../services/productService');

const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.json({
            success: true,
            message: "Data produk berhasil diambil",
            data: products
        });
    } catch (err) {
        console.error('Controller Error:', err);
        res.status(500).json({ 
            success: false, 
            message: "Gagal mengambil data produk",
            error: err.message
        });
    }
};

const getProductsByCategory = async (req, res) => {
    const { kategoriId } = req.params;
    try {
        const products = await productService.getProductsByCategory(kategoriId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getHairColors = async (req, res) => {
    try {
        const colors = await productService.getHairColors();
        res.json(colors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSmoothingProducts = async (req, res) => {
    try {
        const products = await productService.getSmoothingProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getKeratinProducts = async (req, res) => {
    try {
        const products = await productService.getKeratinProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getHairProducts = async (req, res) => {
    try {
        const products = await productService.getHairProducts();
        res.json({
            success: true,
            data: products
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

const getHairColorsByProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const colors = await productService.getHairColorsByProduct(id);
        res.json(colors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const filters = {
            nama: req.query.nama,
            brand_id: req.query.brand_id,
            jenis: req.query.jenis,
            harga_min: req.query.harga_min ? parseInt(req.query.harga_min) : undefined,
            harga_max: req.query.harga_max ? parseInt(req.query.harga_max) : undefined
        };
        const products = await productService.searchProducts(filters);
        res.json({
            success: true,
            message: "Hasil pencarian produk",
            data: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAllProducts,
    getProductsByCategory,
    getHairColors,
    getSmoothingProducts,
    getKeratinProducts,
    getHairProducts,
    getHairColorsByProduct,
    searchProducts
};
