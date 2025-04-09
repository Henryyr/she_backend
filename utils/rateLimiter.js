// utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter setup for booking requests - kept exactly as in original code
const bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { error: "Terlalu banyak permintaan booking, coba lagi nanti." }
});

module.exports = {
    bookingLimiter
};