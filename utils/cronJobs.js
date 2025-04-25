const cron = require('node-cron');
const db = require('../db');
const TransaksiService = require('../services/transaksiService');

// Cron untuk menghapus booking dan transaksi yang expired
const cleanupOldData = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await db.promise().query(`DELETE FROM booking WHERE tanggal < ?`, [today]);
            // Hapus baris berikut jika ingin hanya soft delete:
            // await db.promise().query(`
            //     DELETE FROM transaksi 
            //     WHERE status IN ('failed', 'expired') 
            //     AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
            // `);
        } catch (err) {
            console.error("[CRON] Cleanup error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const initCronJobs = () => {
    cleanupOldData();
    // Handle expired transactions hourly
    cron.schedule('0 */1 * * *', async () => {
        try {
            const transaksiService = new TransaksiService();
            await transaksiService.handleExpiredTransactions();
        } catch (err) {
            console.error("[CRON] Expired transactions error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

module.exports = { initCronJobs };