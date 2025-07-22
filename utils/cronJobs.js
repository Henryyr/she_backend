const cron = require('node-cron');
const { pool } = require('../db');
const emailService = require('../services/user/emailService');

const sendBookingReminderEmails = () => {
  // Jadwal berjalan setiap menit
  cron.schedule('* * * * *', async () => {
    try {
      // Logika baru yang lebih andal: mencari booking dalam rentang 19-20 menit dari sekarang
      const query = `
                SELECT b.id, b.tanggal, b.jam_mulai, u.fullname as nama_customer, u.email,
                       GROUP_CONCAT(l.nama SEPARATOR ', ') as layanan
                FROM booking b
                JOIN users u ON b.user_id = u.id
                JOIN booking_layanan bl ON b.id = bl.booking_id
                JOIN layanan l ON bl.layanan_id = l.id
                WHERE
                    b.status = 'confirmed' AND
                    b.reminder_sent = 0 AND
                    CONCAT(b.tanggal, ' ', b.jam_mulai) BETWEEN
                        NOW() + INTERVAL 19 MINUTE AND
                        NOW() + INTERVAL 20 MINUTE
                GROUP BY b.id;
            `;

      const [bookings] = await pool.query(query);

      if (bookings.length === 0) {
        // Ini kondisi normal, tidak perlu log
        return;
      }

      // Log baru yang lebih jelas
      const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
      console.log(`[${timestamp}] [CRON] Ditemukan ${bookings.length} booking untuk dikirim pengingat.`);

      for (const booking of bookings) {
        if (booking.email) {
          await emailService.sendBookingReminder(booking.email, booking);
          // Tandai bahwa email sudah terkirim
          await pool.query('UPDATE booking SET reminder_sent = 1 WHERE id = ?', [booking.id]);
        }
      }
    } catch (error) {
      console.error('[CRON] Gagal saat proses pengingat booking:', error.message);
    }
  }, {
    timezone: 'Asia/Makassar'
  });
};

const initCronJobs = () => {
  sendBookingReminderEmails();
  console.log('✅ Cron job pengingat booking (versi robust) telah diinisialisasi.');
};

module.exports = { initCronJobs };
