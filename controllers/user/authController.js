const authService = require('../../services/user/authService');
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
        // Kirim req ke loginUser untuk brute force protection
        const { token, user } = await authService.loginUser(req.body, req);
        // Only send safe user fields
        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(error.status || 500).json({ error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (token && req.tokenExp) {
            await authService.blacklistToken(token, req.tokenExp);
        }

        res.json({
            message: "Logout berhasil"
        });
    } catch (error) {
        res.status(500).json({ error: "Logout gagal" });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await authService.getProfile(userId);
        // Only send safe profile fields
        res.json(profile);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile
};
