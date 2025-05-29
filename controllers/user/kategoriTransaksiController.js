const kategoriTransaksiService = require('../../services/user/kategoriTransaksiService');

const getAllKategoriTransaksi = async (req, res) => {
    try {
        const kategori = await kategoriTransaksiService.getAllKategoriTransaksi();
        res.json(kategori);
    } catch (error) {
        console.error('Error in kategori transaksi controller:', error);
        res.status(500).json({ 
            error: 'Gagal mengambil kategori transaksi',
            details: error.message 
        });
    }
};

module.exports = {
    getAllKategoriTransaksi
};
