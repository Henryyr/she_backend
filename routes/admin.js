const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', authenticate, isAdmin, adminController.getDashboard);
router.get('/transaksi', authenticate, isAdmin, adminController.getAllTransactions);

module.exports = router;
