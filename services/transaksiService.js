const db = require('../db');
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const getFrontendURL = () => {
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
    }
    return 'http://localhost:3000';
};

class TransaksiService {
    async createTransaction(booking_id, kategori_transaksi_id, is_dp, user_id) {
        console.log('[TransaksiService] createTransaction started', { booking_id, kategori_transaksi_id, is_dp, user_id });
        const conn = await db.promise();
        try {
            await conn.beginTransaction();

            const [bookingResult] = await conn.query(
                `SELECT id, total_harga, status FROM booking WHERE id = ?`, 
                [booking_id]
            );

            if (bookingResult.length === 0) {
                throw { status: 404, message: "Booking tidak ditemukan" };
            }

            const { total_harga, status } = bookingResult[0];

            if (status === 'completed') {
                throw { status: 400, message: "Booking sudah dibayar" };
            }

            const order_id = `BKG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(booking_id).padStart(3, '0')}`;
            const booking_number = order_id;
            const dp_amount = is_dp ? Math.round(total_harga * 0.3) : 0;
            const amountToPay = is_dp ? dp_amount : total_harga;
            const paid_amount = 0;

            const parameter = {
                transaction_details: { order_id, gross_amount: amountToPay },
                item_details: [{
                    id: booking_id,
                    price: amountToPay,
                    quantity: 1,
                    name: is_dp ? 'Booking Salon (DP 30%)' : 'Booking Salon (Full Payment)',
                    brand: "Salon",
                    category: "Perawatan"
                }],
                customer_details: { user_id },
                callbacks: {
                    finish: `${getFrontendURL()}/`,
                    error: `${getFrontendURL()}/`,
                    pending: `${getFrontendURL()}/`
                }
            };

            const snapResponse = await snap.createTransaction(parameter);
            
            const [result] = await conn.query(
                `INSERT INTO transaksi (user_id, booking_id, total_harga, paid_amount, dp_amount, 
                 kategori_transaksi_id, status, midtrans_order_id, payment_status, booking_number) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, booking_id, total_harga, paid_amount, dp_amount, 
                 kategori_transaksi_id, 'pending', order_id, 'unpaid', booking_number]
            );

            await conn.commit();
            
            console.log('[TransaksiService] createTransaction success', { transaksi_id: result.insertId });
            return {
                message: "Transaksi dibuat",
                transaksi_id: result.insertId,
                status: 'pending',
                snap_url: snapResponse.redirect_url,
                dp_amount: is_dp ? dp_amount : 0,
                remaining_amount: is_dp ? total_harga - dp_amount : 0
            };
        } catch (err) {
            console.error('[TransaksiService] createTransaction error:', err);
            await conn.rollback();
            throw err;
        }
    }

    async handleWebhook(webhookData) {
        console.log('[TransaksiService] handleWebhook started', webhookData);
        const conn = await db.promise();
        try {
            const { order_id, transaction_status, gross_amount } = webhookData;

            if (!order_id || !transaction_status) {
                throw { status: 400, message: "Data tidak lengkap" };
            }

            await conn.beginTransaction();

            const [transaksiResult] = await conn.query(
                `SELECT id, booking_id, total_harga, paid_amount, dp_amount, payment_status 
                 FROM transaksi WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`,
                [order_id, order_id]
            );

            if (transaksiResult.length === 0) {
                throw { status: 404, message: "Transaksi tidak ditemukan" };
            }

            const transaksi = transaksiResult[0];

            if (transaction_status === "settlement" || transaction_status === "capture") {
                const newPaidAmount = parseFloat(transaksi.paid_amount) + parseFloat(gross_amount);
                let paymentStatus = 'DP';
                if (newPaidAmount >= transaksi.total_harga) {
                    paymentStatus = 'paid';
                }

                const newStatus = paymentStatus === 'paid' ? 'completed' : 'pending';

                await conn.query(
                    `UPDATE transaksi 
                     SET paid_amount = ?, 
                         status = ?, 
                         payment_status = ?, 
                         updated_at = CURRENT_TIMESTAMP 
                     WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`,
                    [newPaidAmount, newStatus, paymentStatus, order_id, order_id]
                );

                if (paymentStatus === 'paid') {
                    await conn.query(
                        `UPDATE booking SET status = 'confirmed' WHERE id = ?`,
                        [transaksi.booking_id]
                    );
                }
            } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
                await conn.query(
                    `DELETE FROM transaksi WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`, 
                    [order_id, order_id]
                );
            }

            await conn.commit();
            console.log('[TransaksiService] handleWebhook success', { order_id: webhookData.order_id });
            return { message: "Webhook processed successfully" };
        } catch (err) {
            console.error('[TransaksiService] handleWebhook error:', err);
            await conn.rollback();
            throw err;
        }
    }

    async payRemaining(transaksi_id, user_id) {
        console.log('[TransaksiService] payRemaining started', { transaksi_id, user_id });
        const conn = await db.promise();
        try {
            const [transaksiResult] = await conn.query(
                `SELECT id, booking_id, total_harga, paid_amount, dp_amount, midtrans_order_id 
                 FROM transaksi WHERE id = ? AND user_id = ?`,
                [transaksi_id, user_id]
            );

            if (transaksiResult.length === 0) {
                throw { status: 404, message: "Transaksi tidak ditemukan" };
            }

            const transaksi = transaksiResult[0];

            if (transaksi.dp_amount === 0 || parseFloat(transaksi.paid_amount) < parseFloat(transaksi.dp_amount)) {
                throw { status: 400, message: "DP belum dibayar, pelunasan tidak bisa dilakukan" };
            }

            const sisaPembayaran = parseFloat(transaksi.total_harga) - parseFloat(transaksi.paid_amount);

            if (sisaPembayaran <= 0) {
                throw { status: 400, message: "Transaksi sudah lunas" };
            }

            const pelunasanOrderId = `${transaksi.midtrans_order_id}-PELUNASAN`;

            const snapResponse = await snap.createTransaction({
                transaction_details: { 
                    order_id: pelunasanOrderId,
                    gross_amount: sisaPembayaran 
                },
                item_details: [{
                    id: transaksi.booking_id,
                    price: sisaPembayaran,
                    quantity: 1,
                    name: "Pelunasan Sisa Pembayaran",
                    brand: "Salon",
                    category: "Perawatan"
                }],
                customer_details: { user_id },
                callbacks: {
                    finish: `${getFrontendURL()}/payment/result`,
                    error: `${getFrontendURL()}/payment/error`,
                    pending: `${getFrontendURL()}/payment/pending`
                }
            });

            await conn.query(
                `UPDATE transaksi SET pelunasan_order_id = ? WHERE id = ?`,
                [pelunasanOrderId, transaksi_id]
            );

            console.log('[TransaksiService] payRemaining success', { transaksi_id, pelunasan_order_id: pelunasanOrderId });
            return {
                message: "Silakan lanjutkan pelunasan",
                snap_url: snapResponse.redirect_url,
                sisa_pembayaran: sisaPembayaran
            };
        } catch (err) {
            console.error('[TransaksiService] payRemaining error:', err);
            await conn.rollback();
            throw err;
        }
    }

    async getUserTransactions(user_id) {
        console.log('[TransaksiService] getUserTransactions started', { user_id });
        try {
            const [results] = await db.promise().query(`
                SELECT 
                    t.*, 
                    k.nama AS metode_pembayaran,
                    t.status AS transaction_status,
                    t.payment_status,
                    b.tanggal,
                    b.jam_mulai,
                    b.jam_selesai,
                    b.status AS booking_status,
                    b.created_at AS booking_created_at,
                    b.booking_number,
                    b.total_harga,
                    GROUP_CONCAT(l.nama SEPARATOR ', ') AS layanan_nama
                FROM transaksi t
                JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
                JOIN booking b ON t.booking_id = b.id
                JOIN booking_layanan bl ON b.id = bl.booking_id
                JOIN layanan l ON bl.layanan_id = l.id
                WHERE t.user_id = ?
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `, [user_id]);
            
            console.log('[TransaksiService] getUserTransactions success', { count: results.length });
            return results;
        } catch (err) {
            console.error('[TransaksiService] getUserTransactions error:', err);
            throw err;
        }
    }
}

module.exports = new TransaksiService();
