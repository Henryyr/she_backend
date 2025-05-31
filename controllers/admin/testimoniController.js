const TestimoniService = require('../../services/admin/testimoniService');

const getAllTestimoni = async (req, res) => {
    try {
        const testimonials = await TestimoniService.getAll();
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTestimoni = async (req, res) => {
    try {
        const { id } = req.params;
        await TestimoniService.delete(id);
        res.json({ message: "Testimoni berhasil dihapus" });
    } catch (err) {
        if (err.message === 'Not Found') {
            return res.status(404).json({ error: "Testimoni tidak ditemukan" });
        }
        res.status(500).json({ error: err.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || !status) {
            return res.status(400).json({ error: "id dan status wajib diisi" });
        }
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Status hanya bisa 'approved' atau 'rejected'" });
        }
        await TestimoniService.updateStatus(id, status);
        res.json({ message: `Testimoni berhasil di-${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTestimoni,
    deleteTestimoni,
    updateStatus
};
