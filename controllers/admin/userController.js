const userService = require('../../services/admin/userService');

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userData = await userService.getAllUsers(page, limit);

    userData.pagination.hasNextPage = page < userData.pagination.totalPages;
    userData.pagination.hasPrevPage = page > 1;
    userData.pagination.nextPage = userData.pagination.hasNextPage ? page + 1 : null;
    userData.pagination.prevPage = userData.pagination.hasPrevPage ? page - 1 : null;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data users', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updated = await userService.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui user', error: err });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus user', error: err });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser
};
