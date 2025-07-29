const express = require('express');
const router = express.Router();
const productController = require('../controllers/user/productController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, productController.getAllProducts);
router.get('/out-of-stock', authenticate, productController.getOutOfStockProducts);
router.get('/check-availability', authenticate, productController.checkProductAvailability);
router.post('/invalidate-cache', authenticate, productController.invalidateStockCache);
router.get('/category/:kategoriId', authenticate, productController.getProductsByCategory);
router.get('/smoothing', authenticate, productController.getSmoothingProducts);
router.get('/keratin', authenticate, productController.getKeratinProducts);

// Endpoints untuk hair color
router.get('/hair/products', authenticate, productController.getHairProducts);
router.get('/hair/products/:id/colors', authenticate, productController.getHairColorsByProduct);
router.get('/hair/colors', authenticate, productController.getHairColors);
module.exports = router;
