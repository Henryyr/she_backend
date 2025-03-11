const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware untuk memeriksa token JWT
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Ambil token dari header Authorization

    if (!token) {
        return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token tidak valid" });
        }
        req.user = user; // Simpan data user ke request
        next();
    });
};

// Middleware untuk memeriksa apakah user adalah admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Akses ditolak, Anda bukan admin" });
    }
    next();
};

module.exports = { authenticate, isAdmin };
