// utils/cronJobs.js
const cron = require('node-cron');
const db = require('../db');

// Initialize cron jobs
const initCronJobs = () => {
    // Cron job to auto-cancel unconfirmed bookings after 24 hours
    cron.schedule('0 0 * * *', async () => { // Every midnight
        try {
            await db.promise().query(`
                UPDATE booking 
                SET status = 'canceled' 
                WHERE status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > 24
            `);
            console.log("Booking yang tidak dikonfirmasi lebih dari 24 jam telah dibatalkan.");
        } catch (err) {
            console.error("Error in auto-cancel cron job:", err);
        }
    }, {
        timezone: "Asia/Jakarta" // Sesuaikan timezone
    });
};

module.exports = {
    initCronJobs
};