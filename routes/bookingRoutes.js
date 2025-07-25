const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/user/bookingController');
const { authenticate } = require('../middleware/auth');
const { bookingLimiter } = require('../config/rateLimit');

// Middleware modular
const jsonSanitizer = require('../middleware/jsonSanitizer');
const requestLogger = require('../middleware/requestLogger');
const errorHandler = require('../middleware/errorHandler');

// Middleware
router.use(jsonSanitizer);
router.use(requestLogger);

// Routes
router.post('/', authenticate, bookingLimiter, bookingController.createBooking);
router.get('/', authenticate, bookingController.getAllBookings);
router.post('/available-slots', authenticate, bookingController.postAvailableSlots);
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

// Error handler harus paling bawah
router.use(errorHandler);

module.exports = router;
