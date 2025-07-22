const kategoriService = require('../../services/admin/kategoriService');

const getAllKategoriLayanan = async (req, res) => {
  try {
    const kategoriLayanan = await kategoriService.getAllKategoriLayanan();
    res.json({ success: true, data: kategoriLayanan });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori layanan',
      error: err.message
    });
  }
};

module.exports = {
  getAllKategoriLayanan
};
