// utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    handler: (req, res) => {
        console.log('[RateLimiter] Rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            headers: req.headers,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            error: "Terlalu banyak permintaan booking, coba lagi nanti."
        });
    },
    keyGenerator: (req) => {
        const key = req.ip;
        console.log('[RateLimiter] Generated key:', { ip: key, path: req.path });
        return key;
    },
    skip: (req) => {
        // Optional: Skip rate limiting for certain conditions
        return false; // Don't skip any requests
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

module.exports = {
    bookingLimiter
};