const rateLimit = require('express-rate-limit');

// Rate limits configuration
const RATE_LIMIT = {
    DATABASE: {
        WINDOW_MS: process.env.NODE_ENV === 'production' 
            ? 60 * 60 * 1000  // 1 hour in production
            : 5 * 60 * 1000,  // 5 minutes in development
        MAX_REQUESTS: process.env.NODE_ENV === 'production'
            ? 3  // 3 requests/hour in production
            : 20 // 20 requests/5min in development
    },
    API: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 3 : 50 // 50 requests in dev
    }
};

// Express rate limiter middleware
const bookingLimiter = rateLimit({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX_REQUESTS,
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
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    RATE_LIMIT,
    bookingLimiter
};
