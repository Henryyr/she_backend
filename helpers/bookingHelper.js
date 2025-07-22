// helpers/bookingHelper.js
const db = require('../db');

const generateBookingNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  const sql = `
        SELECT booking_number 
        FROM booking 
        WHERE booking_number LIKE ? 
        ORDER BY booking_number DESC 
        LIMIT 1
    `;

  try {
    const [results] = await db.pool.query(sql, [`BKG-${dateStr}-%`]);

    let nextNumber = 1;
    if (results.length > 0) {
      const lastBooking = results[0].booking_number;
      const lastNumber = parseInt(lastBooking.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `BKG-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
  } catch (err) {
    throw new Error(`Failed to generate booking number: ${err.message}`);
  }
};

module.exports = {
  generateBookingNumber
};
