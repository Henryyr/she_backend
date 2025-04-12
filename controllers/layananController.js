const layananService = require('../services/layananService');

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
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json(layanan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createLayanan = async (req, res) => {
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    if (!kategori_id || !nama || !harga || !estimasi_waktu) {
        return res.status(400).json({ error: "Semua field harus diisi" });
    }

    try {
        const id = await layananService.create({ kategori_id, nama, harga, estimasi_waktu });
        res.json({ message: 'Layanan berhasil ditambahkan', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateLayanan = async (req, res) => {
    const { id } = req.params;
    const { kategori_id, nama, harga, estimasi_waktu } = req.body;

    try {
        const updated = await layananService.update(id, { kategori_id, nama, harga, estimasi_waktu });
        if (!updated) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json({ message: `Layanan ID ${id} berhasil diperbarui` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteLayanan = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await layananService.delete(id);
        if (!deleted) {
            return res.status(404).json({ error: "Layanan tidak ditemukan" });
        }
        res.json({ message: `Layanan ID ${id} berhasil dihapus` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
