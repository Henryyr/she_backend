const layananKategoriService = require('../../services/user/layanankategoriService');

class LayananKategoriController {
  async getAll (req, res) {
    try {
      const results = await layananKategoriService.findAll();
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById (req, res) {
    try {
      const result = await layananKategoriService.findById(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Kategori layanan tidak ditemukan' });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new LayananKategoriController();
