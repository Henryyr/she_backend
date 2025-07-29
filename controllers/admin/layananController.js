const layananService = require('../../services/admin/layananService');
const userLayananService = require('../../services/user/layananService');

const createLayanan = async (req, res) => {
  try {
    const { nama, harga, estimasi_waktu, kategori_id } = req.body;

    if (!nama || !harga || !estimasi_waktu || !kategori_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Semua field wajib diisi'
      });
    }

    const layanan = await layananService.createLayanan({
      nama,
      harga,
      estimasi_waktu,
      kategori_id
    });

    res.status(201).json({
      status: 'success',
      message: 'Layanan berhasil dibuat',
      data: layanan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getAllLayanan = async (req, res) => {
  try {
    const layanan = await userLayananService.getAll();
    res.json({
      status: 'success',
      data: layanan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getLayananById = async (req, res) => {
  try {
    const { id } = req.params;
    const layanan = await userLayananService.getById(id);

    if (!layanan) {
      return res.status(404).json({
        status: 'error',
        message: 'Layanan tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      data: layanan
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, harga, estimasi_waktu, kategori_id } = req.body;

    const updateData = {};
    if (nama !== undefined) updateData.nama = nama;
    if (harga !== undefined) updateData.harga = harga;
    if (estimasi_waktu !== undefined) updateData.estimasi_waktu = estimasi_waktu;
    if (kategori_id !== undefined) updateData.kategori_id = kategori_id;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Tidak ada data yang diupdate'
      });
    }

    const success = await layananService.updateLayanan(id, updateData);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Layanan tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      message: 'Layanan berhasil diupdate'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await layananService.deleteLayanan(id);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Layanan tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      message: 'Layanan berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
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
