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

const updateStock = async (req, res) => {
    const { id } = req.params;
    const { stok } = req.body;
    try {
        await productService.updateStock(id, stok);
        res.json({ message: 'Stok berhasil diupdate' });
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

const updateHairColorStock = async (req, res) => {
    const { id, stok } = req.body;
    try {
        if (!id || stok === undefined) {
            return res.status(400).json({ 
                error: "Format yang benar: { id: number, stok: number }" 
            });
        }

        await productService.updateHairColorStock(id, stok);
        res.json({ 
            success: true,
            message: 'Stok warna berhasil diupdate',
            data: { id, stok }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateSmoothingStock = async (req, res) => {
    const { id, stok } = req.body;
    try {
        if (!id || stok === undefined) {
            return res.status(400).json({ 
                error: "Format yang benar: { id: number, stok: number }" 
            });
        }

        await productService.updateSmoothingStock(id, stok);
        res.json({ 
            success: true,
            message: 'Stok smoothing berhasil diupdate',
            data: { id, stok }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateKeratinStock = async (req, res) => {
    const { id, stok } = req.body;
    try {
        if (!id || stok === undefined) {
            return res.status(400).json({ 
                error: "Format yang benar: { id: number, stok: number }" 
            });
        }

        await productService.updateKeratinStock(id, stok);
        res.json({ 
            success: true,
            message: 'Stok keratin berhasil diupdate',
            data: { id, stok }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addHairColor = async (req, res) => {
    const { product_id, nama, kategori, level, stok, tambahan_harga } = req.body;
    try {
        const result = await productService.addHairColor(product_id, nama, kategori, level, stok, tambahan_harga);
        res.status(201).json({
            message: 'Warna berhasil ditambahkan',
            data: result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllProducts,
    getProductsByCategory,
    updateStock,
    getHairColors,
    getSmoothingProducts,
    getKeratinProducts,
    getHairProducts,
    getHairColorsByProduct,
    updateHairColorStock,
    updateSmoothingStock,
    updateKeratinStock,
    addHairColor
};
