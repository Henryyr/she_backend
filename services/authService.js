const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { validatePassword } = require('../utils/validation');

const registerUser = async (userData) => {
    const { fullname, email, phone_number, username, password, confirmation_password, address } = userData;

    // Prevent malicious role injection
    if (userData.role) {
        throw { status: 403, message: "Tidak diizinkan mengatur role pengguna" };
    }

    if (!fullname || !email || !username || !password || !confirmation_password) {
        throw { status: 400, message: "Semua data wajib diisi" };
    }

    if (password !== confirmation_password) {
        throw { status: 400, message: "Konfirmasi password tidak cocok" };
    }

    if (!validatePassword(password)) {
        throw { status: 400, message: "Password harus minimal 8 karakter, mengandung huruf dan angka" };
    }

    // Cek apakah email atau username sudah digunakan
    const [existingUser] = await pool.query(
        "SELECT id FROM users WHERE email = ? OR username = ?",
        [email, username]
    );

    if (existingUser.length > 0) {
        throw { status: 400, message: "Email atau username sudah digunakan" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'pelanggan';

    const [result] = await pool.query(
        `INSERT INTO users (fullname, email, phone_number, username, password, address, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fullname, email, phone_number, username, hashedPassword, address, role]
    );

    return result;
};
const loginUser = async ({ username, password }) => {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
        throw { status: 401, message: "Username atau password salah" };
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        throw { status: 401, message: "Username atau password salah" };
    }

const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);


    return {
        token,
        user: {
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            role: user.role
        }
    };
};

const getProfile = async (userId) => {
    const [user] = await pool.query(
        'SELECT id, fullname, username, email, phone_number, address, role FROM users WHERE id = ?',
        [userId]
    );
    
    if (user.length === 0) {
        throw { status: 404, message: "User tidak ditemukan" };
    }
    
    return user[0];
};

const blacklistToken = async (token, expiresAt) => {
    // Only store tokens that expire within next 48 hours
    const maxAge = Date.now() + (48 * 60 * 60 * 1000);
    if (expiresAt > maxAge) {
        expiresAt = maxAge;
    }
    
    const sql = 'INSERT INTO blacklisted_tokens (token_id, expires_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)';
    await pool.query(sql, [token, new Date(expiresAt)]);
    console.log(`Token blacklisted successfully. Expires at: ${new Date(expiresAt)}`);
};

const isTokenBlacklisted = async (token) => {
    // Using indexed column for faster query
    const sql = 'SELECT EXISTS(SELECT 1 FROM blacklisted_tokens WHERE token_id = ? AND expires_at > NOW()) as is_blacklisted';
    const [[result]] = await pool.query(sql, [token]);
    return result.is_blacklisted === 1;
};

// Reduce cleanup frequency to every 12 hours since we have MySQL event
const cleanupExpiredTokens = async () => {
    const sql = 'DELETE FROM blacklisted_tokens WHERE expires_at < NOW() - INTERVAL 48 HOUR';
    const [result] = await pool.query(sql);
    if (result.affectedRows > 0) {
        console.log(`Cleaned up ${result.affectedRows} expired tokens from blacklist`);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    blacklistToken,
    isTokenBlacklisted,
    cleanupExpiredTokens
};
