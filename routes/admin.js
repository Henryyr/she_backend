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
router.get('/transactions/user/:userId', adminController.getTransactionsByUserId);

// users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Admin Bookings - CRUD
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/user/:userId', adminController.getBookingsByUserId);
router.get('/bookings/:id', adminController.getBookingById);
router.post('/bookings', adminController.createBooking);  // New route to create bookings as admin
router.put('/bookings/:id', adminController.updateBooking);
router.patch('/bookings/:id/status', adminController.updateBookingStatus);  // New route for updating status
router.delete('/bookings/:id', adminController.deleteBooking);

// Specific booking actions
router.post('/bookings/:id/confirm', adminController.confirmBooking);
router.post('/bookings/:id/cancel', adminController.cancelBooking);
router.post('/bookings/:id/complete', adminController.completeBooking);

module.exports = router;