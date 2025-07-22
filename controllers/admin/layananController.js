const layananService = require('../../services/admin/layananService');
const userLayananService = require('../../services/user/layananService');

const createLayanan = async (req, res) => {
  try {
    const layanan = await layananService.createLayanan(req.body);
    res.status(201).json({
      success: true,
      message: 'Layanan berhasil ditambahkan',
      data: layanan
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan layanan',
      error: err.message
    });
  }
};

const getAllLayanan = async (req, res) => {
  try {
    const layanan = await userLayananService.getAll();
    res.json({ success: true, data: layanan });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data layanan',
      error: err.message
    });
  }
};

const getLayananById = async (req, res) => {
  try {
    const layanan = await userLayananService.getById(req.params.id);
    if (!layanan) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }
    res.json({ success: true, data: layanan });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data layanan',
      error: err.message
    });
  }
};

const updateLayanan = async (req, res) => {
  try {
    const updated = await layananService.updateLayanan(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui layanan',
      error: err.message
    });
  }
};

const deleteLayanan = async (req, res) => {
  try {
    const deleted = await layananService.deleteLayanan(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus layanan',
      error: err.message
    });
  }
};

module.exports = {
  createLayanan,
  getAllLayanan,
  getLayananById,
  updateLayanan,
  deleteLayanan
};
