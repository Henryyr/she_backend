const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/admin/adminController');
const { getIO } = require('../socketInstance');
const router = express.Router();

// Middleware autentikasi & admin check untuk semua route admin
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
router.post('/bookings/offline', adminController.createOfflineBooking);
router.put('/bookings/:id', adminController.updateBooking);
router.delete('/bookings/:id', adminController.deleteBooking);

// Booking status actions
router.post('/bookings/:id/confirm', adminController.confirmBooking);
router.post('/bookings/:id/complete', adminController.completeBooking);
router.post('/bookings/:id/cancel', adminController.cancelBooking);

// Produk - CRUD stok (admin only)
router.get('/products', adminController.getAdminAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Stock update (admin only)
router.post('/products/hair', adminController.updateHairColorStock);
router.post('/products/smoothing', adminController.updateSmoothingStock);
router.post('/products/keratin', adminController.updateKeratinStock);

// Produk berdasarkan kategori (admin only)
router.get('/products/hair', adminController.getAdminHairProducts);
router.get('/products/smoothing', adminController.getAdminSmoothingProducts);
router.get('/products/keratin', adminController.getAdminKeratinProducts);

// Testimoni Admin
router.get('/testimonis', adminController.getAllTestimoni);
router.delete('/testimonis/:id', adminController.deleteTestimoni);
router.put('/testimonis/:id/status', adminController.updateStatus);

// Vouchers Admin
router.get('/vouchers', adminController.getAllVouchers);
router.post('/vouchers', adminController.createVoucher);
router.delete('/vouchers/:id', adminController.deleteVoucher);

// Layanan Admin
router.post('/layanan', adminController.createLayanan);
router.get('/layanan', adminController.getAllLayanan);
router.get('/layanan/:id', adminController.getLayananById);
router.put('/layanan/:id', adminController.updateLayanan);
router.delete('/layanan/:id', adminController.deleteLayanan);

// Kategori Layanan Admin
router.get('/kategori-layanan', adminController.getAllKategoriLayanan);

// test Socket
router.post('/test/socket', (req, res) => {
    try {
        const io = getIO();
        
        // Test emit ke admin room
        io.to('admin-room').emit('test-event', {
            message: 'Test Socket.IO connection from server',
            timestamp: new Date().toISOString(),
            data: req.body
        });
        
        console.log('✅ Test event emitted to admin-room');
        res.json({ success: true, message: 'Test event sent to admin room' });
    } catch (error) {
        console.error('Test socket error:', error);
        res.status(500).json({ error: 'Failed to send test event' });
    }
});

module.exports = router;