const kategoriTransaksiService = require('../services/kategoriTransaksiService');

const getAllKategoriTransaksi = async (req, res) => {
    try {
        const results = await kategoriTransaksiService.getAllKategoriTransaksi();
        res.json({ kategori_transaksi: results });
    } catch (err) {
        console.error("Error saat mengambil kategori transaksi:", err);
        res.status(500).json({ error: "Gagal mengambil data kategori transaksi" });
    }
};

module.exports = {
    getAllKategoriTransaksi
};
