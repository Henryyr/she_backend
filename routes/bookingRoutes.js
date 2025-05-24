const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { bookingLimiter } = require('../config/rateLimit');

// Middleware modular
const jsonSanitizer = require('../middleware/jsonSanitizer');
const requestLogger = require('../middleware/requestLogger');
const errorHandler = require('../middleware/errorHandler');

// Middleware
router.use(jsonSanitizer);
router.use(requestLogger);
router.use(errorHandler);

// Routes
router.post('/', authenticate, bookingLimiter, bookingController.createBooking);
router.get('/', authenticate, bookingController.getAllBookings);
router.get('/available-slots', authenticate, bookingController.getAvailableSlots);
router.get('/:id', authenticate, bookingController.getBookingById);
router.post('/confirm/:bookingNumber', authenticate, bookingController.confirmBooking);
router.post('/cancel/:bookingNumber', authenticate, bookingController.cancelBooking);
router.patch('/:bookingNumber/complete', authenticate, bookingController.completeBooking);
router.delete('/:id', authenticate, bookingController.deleteBooking);

module.exports = router;