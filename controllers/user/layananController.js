const layananService = require('../../services/user/layananService');

const getAllLayanan = async (req, res) => {
  try {
    const layanan = await layananService.getAll();
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
    const layanan = await layananService.getById(id);

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

module.exports = {
  getAllLayanan,
  getLayananById
};
