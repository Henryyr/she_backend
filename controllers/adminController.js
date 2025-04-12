const adminService = require('../services/adminService');

const getDashboard = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.json({ message: "Dashboard Admin - Daftar Pengguna", users });
    } catch (err) {
        res.status(500).json({ message: "Terjadi kesalahan", error: err });
    }
};

const createUser = async (req, res) => {
    try {
        const userId = await adminService.createUser(req.body);
        res.json({ message: "User berhasil ditambahkan", userId });
    } catch (err) {
        res.status(500).json({ message: "Gagal menambah user", error: err });
    }
};

const updateUser = async (req, res) => {
    try {
        const updated = await adminService.updateUser(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ message: "Gagal memperbarui user", error: err });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deleted = await adminService.deleteUser(req.params.id);
        if (!deleted) return res.status(404).json({ message: "User tidak ditemukan" });

        res.json({ message: "User berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: "Gagal menghapus user", error: err });
    }
};

module.exports = {
    getDashboard,
    createUser,
    updateUser,
    deleteUser
};
