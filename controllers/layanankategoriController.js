const layananKategoriService = require('../services/layanankategoriService');

class LayananKategoriController {
    async getAll(req, res) {
        try {
            const results = await layananKategoriService.findAll();
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getById(req, res) {
        try {
            const result = await layananKategoriService.findById(req.params.id);
            if (!result) {
                return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
            }
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async create(req, res) {
        const { nama } = req.body;
        if (!nama) {
            return res.status(400).json({ error: "Nama kategori layanan harus diisi" });
        }

        try {
            const id = await layananKategoriService.create(nama);
            res.json({ message: 'Kategori layanan berhasil ditambahkan', id });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const affectedRows = await layananKategoriService.update(req.params.id, req.body.nama);
            if (affectedRows === 0) {
                return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
            }
            res.json({ message: `Kategori layanan ID ${req.params.id} berhasil diperbarui` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const affectedRows = await layananKategoriService.delete(req.params.id);
            if (affectedRows === 0) {
                return res.status(404).json({ error: "Kategori layanan tidak ditemukan" });
            }
            res.json({ message: `Kategori layanan ID ${req.params.id} berhasil dihapus` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new LayananKategoriController();
