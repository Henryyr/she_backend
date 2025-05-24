const db = require('../db');

module.exports = async function bookingSlotValidator(req, res, next) {
    const pool = db.pool; // gunakan db.pool langsung
    try {
        const { layanan_id, tanggal, jam_mulai } = req.body;
        if (!layanan_id || !tanggal || !jam_mulai) {
            return res.status(400).json({ error: 'layanan_id, tanggal, dan jam_mulai wajib diisi' });
        }

        // Hitung estimasi waktu booking
        let layananIds = Array.isArray(layanan_id) ? layanan_id : [layanan_id];
        const [allLayanan] = await pool.query(
            `SELECT id, estimasi_waktu FROM layanan`
        );
        const selectedLayanan = allLayanan.filter(l => layananIds.includes(String(l.id)) || layananIds.includes(Number(l.id)));
        if (selectedLayanan.length !== layananIds.length) {
            return res.status(400).json({ error: 'Beberapa layanan tidak ditemukan' });
        }
        const estimasi_waktu = selectedLayanan.reduce((sum, l) => sum + l.estimasi_waktu, 0);

        // Ambil semua booking aktif di tanggal tsb
        const [bookings] = await pool.query(
            `SELECT jam_mulai, jam_selesai FROM booking 
             WHERE tanggal = ? AND status NOT IN ('canceled', 'completed')`,
            [tanggal]
        );

        function toMinutes(timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        }
        const startMinutes = toMinutes(jam_mulai);
        const endMinutes = startMinutes + estimasi_waktu;

        for (const b of bookings) {
            const bStart = toMinutes(b.jam_mulai.length === 5 ? b.jam_mulai : b.jam_mulai.slice(0, 5));
            const bEnd = toMinutes(b.jam_selesai.length === 5 ? b.jam_selesai : b.jam_selesai.slice(0, 5));
            if (startMinutes < bEnd && endMinutes > bStart) {
                return res.status(409).json({
                    error: `Slot tidak tersedia. Bentrok dengan booking lain dari jam ${b.jam_mulai} sampai ${b.jam_selesai}.`
                });
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Gagal validasi slot booking', message: error.message });
    }
};
