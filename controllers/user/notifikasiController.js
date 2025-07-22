const { getIO } = require('../../socketInstance');

class NotifikasiController {
  // Kirim notifikasi realtime ke semua client
  static kirimNotifikasi (req, res) {
    const io = getIO();
    if (!io) {
      return res.status(503).json({ error: 'Socket.IO belum siap' });
    }
    io.emit('notifikasi', { pesan: 'Notifikasi baru!' });
    res.json({ message: 'Notifikasi dikirim' });
  }
}

module.exports = NotifikasiController;
