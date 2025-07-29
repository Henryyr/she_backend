const cron = require('node-cron');
const { pool } = require('../db');
const emailService = require('../services/user/emailService');
const authService = require('../services/user/authService');

const sendBookingReminderEmails = () => {
  // Jadwal berjalan setiap 5 menit untuk ketahanan yang lebih baik
  cron.schedule('*/5 * * * *', async () => {
    try {
      // Logika yang lebih tangguh: mencari booking dalam rentang 15-30 menit dari sekarang
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
                        NOW() + INTERVAL 15 MINUTE AND
                        NOW() + INTERVAL 30 MINUTE
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

// Cleanup expired blacklisted tokens every 12 hours
cron.schedule('0 */12 * * *', async () => {
  try {
    console.log('[CronJob] Cleaning up expired blacklisted tokens...');
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM blacklisted_tokens WHERE expires_at < NOW() - INTERVAL 48 HOUR');
      console.log('[CronJob] Expired blacklisted tokens cleaned up successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[CronJob] Error cleaning up expired blacklisted tokens:', error);
  }
});

// Cleanup old login attempts every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('[CronJob] Cleaning up old login attempts...');
    await authService.cleanupOldLoginAttempts();
    console.log('[CronJob] Old login attempts cleaned up successfully');
  } catch (error) {
    console.error('[CronJob] Error cleaning up old login attempts:', error);
  }
});

// Cleanup expired password reset tokens every 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[CronJob] Cleaning up expired password reset tokens...');
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM password_resets WHERE expires_at < NOW()');
      console.log('[CronJob] Expired password reset tokens cleaned up successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[CronJob] Error cleaning up expired password reset tokens:', error);
  }
});

const initCronJobs = () => {
  sendBookingReminderEmails();
  console.log('✅ Cron job pengingat booking (versi robust) telah diinisialisasi.');
};

module.exports = { initCronJobs };
