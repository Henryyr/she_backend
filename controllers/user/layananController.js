const layananService = require('../../services/user/layananService');

exports.getAllLayanan = async (req, res) => {
  try {
    const layanan = await layananService.getAll();
    res.json(layanan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLayananById = async (req, res) => {
  const { id } = req.params;
  try {
    const layanan = await layananService.getById(id);
    if (!layanan) {
      return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    }
    res.json(layanan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
