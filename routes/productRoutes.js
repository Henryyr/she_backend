const express = require('express');
const router = express.Router();
const productController = require('../controllers/user/productController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, productController.getAllProducts);
router.get('/category/:kategoriId', authenticate, productController.getProductsByCategory);
router.get('/smoothing', authenticate, productController.getSmoothingProducts);
router.get('/keratin', authenticate, productController.getKeratinProducts);

// Endpoints untuk hair color
router.get('/hair/products', authenticate, productController.getHairProducts);
router.get('/hair/products/:id/colors', authenticate, productController.getHairColorsByProduct);
router.get('/hair/colors', authenticate, productController.getHairColors);
module.exports = router;
