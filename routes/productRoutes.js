const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/category/:kategoriId', productController.getProductsByCategory);
router.get('/smoothing', productController.getSmoothingProducts);
router.get('/keratin', productController.getKeratinProducts);
router.patch('/:id/stock', authenticate, isAdmin, productController.updateStock);

// Endpoints untuk hair color
router.get('/hair/products', productController.getHairProducts);             // Get list produk cat rambut
router.get('/hair/products/:id/colors', productController.getHairColorsByProduct); // Get warna untuk produk tertentu

// Admin routes untuk mengelola produk
router.post('/hair/colors', authenticate, isAdmin, productController.addHairColor);

// Update stok endpoints (admin only)
router.post('/haircolor/stock', authenticate, isAdmin, productController.updateHairColorStock);
router.post('/smoothing/stock', authenticate, isAdmin, productController.updateSmoothingStock);
router.post('/keratin/stock', authenticate, isAdmin, productController.updateKeratinStock);

module.exports = router;
