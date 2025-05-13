const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Semua routes admin harus melalui middleware authenticate dan isAdmin
router.use(authenticate, isAdmin);

// dashboard
router.get('/dashboard', adminController.getDashboard);

// transaksi
router.get('/transaksi', adminController.getAllTransactions);
router.get('/transactions/user/:userId', authenticate, adminController.getTransactionsByUserId);

// users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

//booking
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/user/:userId', adminController.getBookingsByUserId);



module.exports = router;
