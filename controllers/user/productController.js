const productService = require('../../services/user/productService');

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json({
      success: true,
      message: 'Data produk berhasil diambil',
      data: products
    });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk',
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

const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await productService.getOutOfStockProducts();
    res.json({
      success: true,
      message: 'Data produk yang habis berhasil diambil',
      data: products
    });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk yang habis',
      error: err.message
    });
  }
};

const checkProductAvailability = async (req, res) => {
  try {
    const { product_id, product_type, color_id } = req.query;

    if (!product_id || !product_type) {
      return res.status(400).json({
        success: false,
        message: 'product_id dan product_type harus disediakan'
      });
    }

    const availability = await productService.checkProductAvailability(
      parseInt(product_id),
      product_type,
      color_id ? parseInt(color_id) : null
    );

    res.json({
      success: true,
      message: 'Status ketersediaan produk berhasil dicek',
      data: availability
    });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengecek ketersediaan produk',
      error: err.message
    });
  }
};

const invalidateStockCache = async (req, res) => {
  try {
    await productService.invalidateStockCache();
    res.json({
      success: true,
      message: 'Cache stok berhasil di-invalidate'
    });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal invalidate cache stok',
      error: err.message
    });
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
  getOutOfStockProducts,
  checkProductAvailability,
  invalidateStockCache
};
