// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { bookingLimiter } = require('../utils/rateLimiter');

// Booking routes
router.post('/', authenticate, bookingLimiter, bookingController.createBooking);
router.get('/', authenticate, bookingController.getAllBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.get('/send-email', bookingController.sendTestEmail);
router.post('/confirm/:bookingNumber', authenticate, bookingController.confirmBooking);
router.post('/cancel/:bookingNumber', authenticate, bookingController.cancelBooking);
router.patch('/:bookingNumber/complete', authenticate, bookingController.completeBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;