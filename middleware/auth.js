const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const SECRET_KEY = process.env.JWT_SECRET;

// Add error logging rate limit tracking
const errorLogTracker = {
    lastLog: {},
    logInterval: 5 * 60 * 1000 // 5 minutes
};

// Run cleanup every 12 hours instead of every hour
setInterval(async () => {
    try {
        await authService.cleanupExpiredTokens();
    } catch (error) {
        console.error('Token cleanup error:', error);
    }
}, 12 * 60 * 60 * 1000);

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            console.log('Authentication failed: No token provided');
            return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
        }

        // Check blacklist in database
        const isBlacklisted = await authService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            console.log('Authentication failed: Token is blacklisted');
            return res.status(401).json({ error: "Token tidak valid atau sudah logout" });
        }

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                let errorMessage = "Token tidak valid";
                if (err.message === 'jwt malformed') {
                    errorMessage = "Format token tidak valid, silakan login kembali";
                } else if (err.message === 'jwt expired') {
                    errorMessage = "Sesi anda telah berakhir, silakan login kembali";
                }
                
                // Rate limited logging
                const now = Date.now();
                const errorKey = `${err.message}-${req.ip}`;
                if (!errorLogTracker.lastLog[errorKey] || 
                    (now - errorLogTracker.lastLog[errorKey]) > errorLogTracker.logInterval) {
                    console.log('Authentication failed:', err.message);
                    errorLogTracker.lastLog[errorKey] = now;
                }

                return res.status(403).json({ error: errorMessage });
            }
            req.user = user;
            req.token = token;
            req.tokenExp = user.exp * 1000;
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: "Server error" });
    }
};

// Middleware untuk memeriksa apakah user adalah admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Akses ditolak, Anda bukan admin" });
    }
    next();
};

module.exports = { 
    authenticate, 
    isAdmin
};
