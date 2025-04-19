const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.json({ message: 'User berhasil didaftarkan', id: result.insertId });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { token, user } = await authService.loginUser(req.body);
        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(error.status || 500).json({ error: error.message });
    }
};

const logout = (req, res) => {
    res.json({
        message: "Logout berhasil, silakan hapus token di client"
    });
};

const getProfile = (req, res) => {
    res.json({ message: "Profil user", user: req.user });
};

module.exports = {
    register,
    login,
    logout,
    getProfile
};
