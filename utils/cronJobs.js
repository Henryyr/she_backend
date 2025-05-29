const cron = require('node-cron');
const { pool } = require('../db');
const TransaksiService = require('../services/user/transaksiService');
const emailService = require('../services/user/emailService');
const authService = require('../services/user/authService');

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
            // FIX: Use TransaksiService directly (it's a singleton, not a class)
            await TransaksiService.handleExpiredTransactions();
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

            const [bookings] = await pool.query(
                `SELECT b.*, u.email, u.username, u.fullname FROM booking b
                 JOIN users u ON b.user_id = u.id
                 WHERE b.tanggal = ? AND b.jam_mulai = ?`,
                [dateString, timeString]
            );

            if (!bookings || bookings.length === 0) {
                console.log('[CRON] No bookings found for reminders.');
                return;
            }

            let sentCount = 0;
            for (const booking of bookings) {
                if (!booking.email) continue;
                try {
                    await emailService.sendBookingInformation(booking.email, booking);
                    sentCount++;
                    console.log(`[CRON] Reminder email sent to ${booking.email} for booking at ${booking.tanggal} ${booking.jam_mulai}`);
                } catch (err) {
                    console.error(`[CRON] Failed to send reminder to ${booking.email}:`, err.message);
                }
            }
            console.log(`[CRON] Processed ${sentCount} booking reminders`);
        } catch (err) {
            console.error('[CRON] Error sending booking reminder emails:', err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const cleanupExpiredTokensJob = () => {
    cron.schedule('0 2 * * *', async () => {
        // Setiap hari jam 02:00 WIB
        console.log('[CRON] cleanupExpiredTokensJob running at', new Date().toISOString());
        try {
            await authService.cleanupExpiredTokens();
            console.log('[CRON] cleanupExpiredTokensJob completed successfully.');
        } catch (err) {
            console.error("[CRON] cleanupExpiredTokensJob error:", err.message);
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
    cleanupExpiredTokensJob(); // panggil di sini
    console.log('[CRON] All cron jobs scheduled.');
};

module.exports = { initCronJobs };
