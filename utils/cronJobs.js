const cron = require('node-cron');
const db = require('../db');
const TransaksiService = require('../services/transaksiService');

// Cron untuk menghapus booking dan transaksi yang expired
const cleanupOldData = () => {
    cron.schedule('0 0 * * *', async () => { // jalan tiap tengah malam
        console.log('[CRON] CleanupOldData running at', new Date().toISOString());
        try {
            const today = new Date().toISOString().split('T')[0];
            const [result] = await db.promise().query(`DELETE FROM booking WHERE tanggal < ?`, [today]);
            console.log(`[CRON] Deleted ${result.affectedRows} expired bookings.`);
            // Jika mau, aktifkan juga ini untuk hapus transaksi expired:
            // const [transResult] = await db.promise().query(`
            //     DELETE FROM transaksi 
            //     WHERE status IN ('failed', 'expired') 
            //     AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
            // `);
            // console.log(`[CRON] Deleted ${transResult.affectedRows} expired transactions.`);
        } catch (err) {
            console.error("[CRON] Cleanup error:", err.message);
        }
    }, {
        timezone: "Asia/Jakarta"
    });
};

const handleExpiredTransactionsJob = () => {
    cron.schedule('0 */1 * * *', async () => { // jalan tiap jam
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

const initCronJobs = () => {
    console.log('[CRON] Initializing cron jobs...');
    cleanupOldData();
    handleExpiredTransactionsJob();
    console.log('[CRON] All cron jobs scheduled.');
};

module.exports = { initCronJobs };
