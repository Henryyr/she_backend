// config/midtrans.js
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: process.env.NODE_ENV === 'production', // Otomatis mengikuti env
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Add Midtrans status mapping
const MIDTRANS_STATUS = {
    PAYMENT: {
        PENDING: ['pending', 'challenge'],
        AUTHORIZED: ['authorize'],
        SUCCESS: ['capture', 'settlement', 'success'],
        FAILED: ['deny', 'cancel', 'expire', 'failed', 'denied'],
        REFUND: ['refund', 'partial_refund'],
        CHARGEBACK: ['chargeback'],
        REVERSED: ['reversal'],
        CANCELLED: ['cancelled'],
        EXPIRED: ['expired']
    },
    WITHDRAWAL: {
        REQUESTED: ['requested'],
        PROCESSING: ['processing'],
        SUCCESS: ['success'],
        FAILED: ['failed'],
        CANCELLED: ['cancelled']
    }
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
