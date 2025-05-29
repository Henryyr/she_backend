const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../db');
const { validatePassword } = require('../../utils/validation');
const https = require('https');

// --- Brute force protection ---
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 menit

function getLoginKey(username, ip) {
    return `${username || ''}_${ip || ''}`;
}

function isBlocked(username, ip) {
    const key = getLoginKey(username, ip);
    const attempt = loginAttempts[key];
    if (!attempt) return false;
    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) return true;
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
        delete loginAttempts[key];
        return false;
    }
    return false;
}

function recordLoginAttempt(username, ip, success) {
    const key = getLoginKey(username, ip);
    if (!loginAttempts[key]) {
        loginAttempts[key] = { count: 0, blockedUntil: null };
    }
    if (success) {
        delete loginAttempts[key];
        return;
    }
    loginAttempts[key].count += 1;
    if (loginAttempts[key].count >= MAX_ATTEMPTS) {
        loginAttempts[key].blockedUntil = Date.now() + BLOCK_TIME;
    }
}

// Fungsi untuk masking email
function maskEmail(email) {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const visible = name.length > 2 ? 2 : 1;
    return name.slice(0, visible) + '*'.repeat(Math.max(0, name.length - visible)) + '@' + domain;
}

// Fungsi untuk masking nomor telepon
function maskPhone(phone) {
    if (!phone) return '';
    if (phone.length <= 4) return '*'.repeat(phone.length);
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
}

// Fungsi untuk lookup lokasi IP (menggunakan ip-api.com, non-blocking, hanya logging)
function logIpLocation(ip) {
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
        console.log(`Brute force detected from local IP: ${ip}`);
        return;
    }
    const url = `https://ip-api.com/json/${ip}?fields=status,country,regionName,city,query`;
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => {
            try {
                const info = JSON.parse(data);
                if (info.status === 'success') {
                    console.log(`Brute force detected from IP: ${ip} (${info.country}, ${info.regionName}, ${info.city})`);
                } else {
                    console.log(`Brute force detected from IP: ${ip} (location unknown)`);
                }
            } catch {
                console.log(`Brute force detected from IP: ${ip} (location parse error)`);
            }
        });
    }).on("error", () => {
        console.log(`Brute force detected from IP: ${ip} (location fetch error)`);
    });
}

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
const loginUser = async ({ username, password }, req = {}) => {
    // Brute force protection
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
    if (isBlocked(username, ip)) {
        // Log IP dan lokasi saat brute force terdeteksi
        logIpLocation(ip);
        throw { status: 429, message: "Terlalu banyak percobaan login. Silakan coba lagi nanti." };
    }

    // Only select password for login
    // Gunakan parameterized query, tidak interpolasi string mentah
    const [users] = await pool.query(
        'SELECT id, fullname, username, email, phone_number, password, role FROM users WHERE username = ?',
        [username]
    );

    if (users.length === 0) {
        recordLoginAttempt(username, ip, false);
        throw { status: 401, message: "Username atau password salah" };
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        recordLoginAttempt(username, ip, false);
        throw { status: 401, message: "Username atau password salah" };
    }

    recordLoginAttempt(username, ip, true);

    // Never return password hash
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
            email: maskEmail(user.email),
            phone_number: maskPhone(user.phone_number),
            role: user.role
        }
    };
};

const getProfile = async (userId) => {
    // Never select password
    const [user] = await pool.query(
        'SELECT id, fullname, username, email, phone_number, address, role FROM users WHERE id = ?',
        [userId]
    );
    
    if (user.length === 0) {
        throw { status: 404, message: "User tidak ditemukan" };
    }
    
    // Only return safe fields, mask email & phone
    const u = user[0];
    return {
        id: u.id,
        fullname: u.fullname,
        username: u.username,
        email: maskEmail(u.email),
        phone_number: maskPhone(u.phone_number),
        address: u.address,
        role: u.role
    };
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

// Aktifkan kembali fungsi cleanupExpiredTokens
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
    cleanupExpiredTokens // tetap diekspor untuk dipakai cron
};
