const cron = require('node-cron');
const db = require('../db');
const TransaksiService = require('../services/transaksiService');
const emailService = require('../services/emailService'); // pastikan sudah import emailService

// Cron untuk menghapus booking dan transaksi yang expired
const cleanupOldData = () => {
    cron.schedule('0 0 * * *', async () => { // tiap tengah malam
        console.log('[CRON] CleanupOldData running at', new Date().toISOString());
        try {
            const today = new Date().toISOString().split('T')[0];
            const [result] = await db.promise().query(`DELETE FROM booking WHERE tanggal < ?`, [today]);
            console.log(`[CRON] Deleted ${result.affectedRows} expired bookings.`);
        } catch (err) {
            console.error("[CRON] Cleanup error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const handleExpiredTransactionsJob = () => {
    cron.schedule('0 */1 * * *', async () => { // tiap jam
        console.log('[CRON] handleExpiredTransactionsJob running at', new Date().toISOString());
        try {
            const transaksiService = new TransaksiService();
            await transaksiService.handleExpiredTransactions();
            console.log('[CRON] handleExpiredTransactionsJob completed successfully.');
        } catch (err) {
            console.error("[CRON] Expired transactions error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const sendBookingReminderEmails = () => {
    cron.schedule('*/5 * * * *', async () => { // tiap 5 menit
        console.log('[CRON] sendBookingReminderEmails running at', new Date().toISOString());
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + 20 * 60000); // sekarang + 20 menit
            const dateString = reminderTime.toISOString().split('T')[0]; // yyyy-mm-dd
            const timeString = reminderTime.toTimeString().slice(0,5); // HH:mm

            const [bookings] = await db.promise().query(
                `SELECT b.*, u.email, u.name FROM booking b
                 JOIN users u ON b.user_id = u.id
                 WHERE b.tanggal = ? AND b.jam_mulai = ?`,
                [dateString, timeString]
            );

            for (const booking of bookings) {
                if (booking.email) {
                    await emailService.sendBookingInformation(
                        booking.email,
                        booking
                    );
                    console.log(`[CRON] Reminder email sent to ${booking.email} for booking at ${booking.tanggal} ${booking.jam_mulai}`);
                }
            }
        } catch (err) {
            console.error('[CRON] Error sending booking reminder emails:', err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const initCronJobs = () => {
    console.log('[CRON] Initializing cron jobs...');
    cleanupOldData();
    handleExpiredTransactionsJob();
    sendBookingReminderEmails(); // panggil fungsi pengingat email di sini
    console.log('[CRON] All cron jobs scheduled.');
};

module.exports = { initCronJobs };
