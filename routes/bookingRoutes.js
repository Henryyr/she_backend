// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { bookingLimiter } = require('../utils/rateLimiter');

// Add request logging middleware
router.use((req, res, next) => {
    console.log('[BookingRoutes] Incoming request:', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next();
});

// Add error handler for rate limiter
router.use((err, req, res, next) => {
    if (err instanceof Error && err.statusCode === 429) {
        return res.status(429).json({ error: err.message });
    }
    next(err);
});

// Booking routes
router.post('/', authenticate, bookingLimiter, bookingController.createBooking);
router.get('/', authenticate, bookingController.getAllBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.get('/send-email', bookingController.sendTestEmail);
router.post('/confirm/:bookingNumber', authenticate, bookingController.confirmBooking);
router.post('/cancel/:bookingNumber', authenticate, bookingController.cancelBooking);
router.patch('/:bookingNumber/complete', authenticate, bookingController.completeBooking);
router.delete('/:id', authenticate, bookingController.deleteBooking);

module.exports = router;