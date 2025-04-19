const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { validatePassword } = require('../utils/validation');

const registerUser = async (userData) => {
    const { fullname, email, phone_number, username, password, confirmation_password, address, role = "pelanggan" } = userData;

    if (!fullname || !email || !username || !password || !confirmation_password) {
        throw { status: 400, message: "Semua data wajib diisi" };
    }

    if (password !== confirmation_password) {
        throw { status: 400, message: "Konfirmasi password tidak cocok" };
    }

    if (!validatePassword(password)) {
        throw { status: 400, message: "Password harus minimal 8 karakter, mengandung huruf dan angka" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (fullname, email, phone_number, username, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    return pool.query(sql, [fullname, email, phone_number, username, hashedPassword, address, role]);
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
        { id: user.id, role: user.role }, 
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

module.exports = {
    registerUser,
    loginUser,
    getProfile
};
