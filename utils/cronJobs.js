const cron = require('node-cron');
const { pool: db } = require('../db'); // ✅ FIXED
const TransaksiService = require('../services/transaksiService');
const emailService = require('../services/emailService');

const cleanupOldData = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] CleanupOldData running at', new Date().toISOString());
        try {
            const today = new Date().toISOString().split('T')[0];
            const [result] = await db.query(`DELETE FROM booking WHERE tanggal < ?`, [today]); // ✅ FIXED
            console.log(`[CRON] Deleted ${result.affectedRows} expired bookings.`);
        } catch (err) {
            console.error("[CRON] Cleanup error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const handleExpiredTransactionsJob = () => {
    cron.schedule('0 */1 * * *', async () => {
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
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] sendBookingReminderEmails running at', new Date().toISOString());
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + 20 * 60000);
            const dateString = reminderTime.toISOString().split('T')[0];
            const timeString = reminderTime.toTimeString().slice(0,5);

            const [bookings] = await db.query(
                `SELECT b.*, u.email, u.name FROM booking b
                 JOIN users u ON b.user_id = u.id
                 WHERE b.tanggal = ? AND b.jam_mulai = ?`,
                [dateString, timeString] // ✅ FIXED
            );

            for (const booking of bookings) {
                if (booking.email) {
                    await emailService.sendBookingInformation(booking.email, booking);
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
    sendBookingReminderEmails();
    console.log('[CRON] All cron jobs scheduled.');
};

module.exports = { initCronJobs };
