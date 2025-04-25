// config/midtrans.js
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Add Midtrans status mapping
const MIDTRANS_STATUS = {
    PENDING: ['pending'],
    SUCCESS: ['capture', 'settlement'],
    FAILED: ['deny', 'cancel', 'expire'],
    REFUND: ['refund', 'partial_refund']
};

// Add helper function to validate Midtrans notification
const validateMidtransNotification = (notification) => {
    const { order_id, status_code, signature_key } = notification;
    if (!order_id || !status_code || !signature_key) {
        throw new Error('Invalid Midtrans notification format');
    }
    return true;
};

module.exports = {
    snap,
    MIDTRANS_STATUS,
    validateMidtransNotification
};
