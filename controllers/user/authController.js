const authService = require('../../services/user/authService');
const emailService = require('../../services/user/emailService');

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

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email wajib diisi" });
        }
        const result = await authService.requestPasswordReset(email);
        if (result && result.token && result.user) {
            await emailService.sendPasswordResetEmail(result.user.email, result.user.fullname, result.token);
        }
        // Always return success for security
        res.json({ message: "Jika email terdaftar, link reset password telah dikirim." });
    } catch (error) {
        res.status(500).json({ error: "Gagal memproses permintaan reset password" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmation_password } = req.body;
        await authService.resetPassword(token, password, confirmation_password);
        res.json({ message: "Password berhasil direset. Silakan login dengan password baru Anda." });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password, confirmation_password } = req.body;
        if (current_password === new_password) {
            return res.status(400).json({ error: "Password baru tidak boleh sama dengan password lama" });
        }
        await authService.changePassword(userId, current_password, new_password, confirmation_password);
        res.json({ message: "Password berhasil diubah" });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword
};
