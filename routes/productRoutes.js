const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, productController.getAllProducts);
router.get('/category/:kategoriId', authenticate, productController.getProductsByCategory);
router.get('/smoothing', authenticate, productController.getSmoothingProducts);
router.get('/keratin', authenticate, productController.getKeratinProducts);

// Endpoints untuk hair color
router.get('/hair/products', authenticate, productController.getHairProducts);             // Get list produk cat rambut
router.get('/hair/products/:id/colors', authenticate, productController.getHairColorsByProduct); // Get warna untuk produk tertentu
router.get('/hair/colors', authenticate, productController.getHairColors);

// Endpoint untuk pencarian produk detail
router.get('/search', authenticate, productController.searchProducts);

// Tidak ada route POST, PUT, PATCH, DELETE di sisi user

module.exports = router;
