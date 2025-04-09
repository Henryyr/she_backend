// helpers/bookingHelper.js
const db = require('../db');

// Function to generate booking number - kept exactly as in original code
const generateBookingNumber = async () => {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        const sql = `
            SELECT booking_number 
            FROM booking 
            WHERE booking_number LIKE ? 
            ORDER BY booking_number DESC 
            LIMIT 1
        `;

        db.query(sql, [`BKG-${dateStr}-%`], (err, results) => {
            if (err) return reject(err);

            let nextNumber = 1;
            if (results.length > 0) {
                const lastBooking = results[0].booking_number;
                const lastNumber = parseInt(lastBooking.split('-')[2], 10);
                nextNumber = lastNumber + 1;
            }

            const newBookingNumber = `BKG-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
            resolve(newBookingNumber);
        });
    });
};

module.exports = {
    generateBookingNumber
};