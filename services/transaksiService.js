const { pool } = require('../db');
const { sendEmail } = require('./emailService');
const transactionReceiptTemplate = require('../html/transactionReceipt');
const { snap, MIDTRANS_STATUS, validateMidtransNotification } = require('../config/midtrans');
const axios = require('axios');

class TransaksiService {
  async getTransactionStatus(order_id, user_id = null) {
    console.log('[TransaksiService] getTransactionStatus started', { order_id, user_id });
    try {
      const midtransResponse = await this.fetchMidtransStatus(order_id);
      const localTransaction = await this.getLocalTransactionData(order_id, user_id);

      const combinedData = {
        midtrans_data: {
          status_code: midtransResponse.status_code,
          transaction_id: midtransResponse.transaction_id,
          gross_amount: midtransResponse.gross_amount,
          currency: midtransResponse.currency,
          order_id: midtransResponse.order_id,
          payment_type: midtransResponse.payment_type,
          transaction_status: midtransResponse.transaction_status,
          fraud_status: midtransResponse.fraud_status,
          status_message: midtransResponse.status_message,
          transaction_time: midtransResponse.transaction_time,
          settlement_time: midtransResponse.settlement_time,
          expiry_time: midtransResponse.expiry_time,
          va_numbers: midtransResponse.va_numbers || null,
          payment_amounts: midtransResponse.payment_amounts || []
        },
        local_data: localTransaction,
        summary: {
          order_id: midtransResponse.order_id,
          amount_paid: midtransResponse.gross_amount,
          payment_status: this.mapMidtransStatus(midtransResponse.transaction_status),
          transaction_time: midtransResponse.transaction_time,
          settlement_time: midtransResponse.settlement_time,
          payment_method: midtransResponse.payment_type,
          is_success: ['settlement', 'capture'].includes(midtransResponse.transaction_status)
        }
      };

      console.log('[TransaksiService] getTransactionStatus success', { order_id });
      return combinedData;

    } catch (error) {
      console.error('[TransaksiService] getTransactionStatus error:', error);
      if (error.status === 404 && error.source === 'midtrans') {
        throw {
          status: 404,
          message: "Transaksi tidak ditemukan di Midtrans",
          details: `Order ID: ${order_id}`
        };
      }
      if (error.status === 404 && error.source === 'local') {
        throw {
          status: 404,
          message: "Transaksi tidak ditemukan di sistem lokal",
          details: `Order ID: ${order_id}`
        };
      }
      throw {
        status: error.status || 500,
        message: error.message || "Gagal mengambil status transaksi",
        details: process.env.NODE_ENV === 'development' ? error.details : undefined
      };
    }
  }

  async fetchMidtransStatus(order_id) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    try {
      const response = await axios.get(`${baseUrl}/v2/${order_id}/status`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(serverKey + ':').toString('base64')}`
        },
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      console.error('[TransaksiService] fetchMidtransStatus error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw {
          status: 404,
          source: 'midtrans',
          message: "Transaksi tidak ditemukan di Midtrans",
          details: error.response.data
        };
      }
      if (error.response?.status === 401) {
        throw {
          status: 401,
          message: "Unauthorized - Periksa server key Midtrans",
          details: "Invalid authorization"
        };
      }
      throw {
        status: error.response?.status || 500,
        message: "Gagal mengambil data dari Midtrans",
        details: error.response?.data || error.message
      };
    }
  }

  async getLocalTransactionData(order_id, user_id = null) {
    try {
      let query = `
        SELECT 
          t.id,
          t.booking_number,
          t.midtrans_order_id,
          t.pelunasan_order_id,
          t.total_harga,
          t.paid_amount,
          t.dp_amount,
          t.status AS transaction_status,
          t.payment_status,
          t.created_at,
          t.updated_at,
          t.user_id,
          k.nama AS metode_pembayaran,
          b.tanggal AS booking_date,
          b.jam_mulai,
          b.jam_selesai,
          b.status AS booking_status,
          u.nama AS user_name,
          u.email AS user_email,
          GROUP_CONCAT(l.nama ORDER BY l.nama SEPARATOR ', ') AS layanan_nama
        FROM transaksi t
        JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
        JOIN booking b ON t.booking_id = b.id
        JOIN users u ON t.user_id = u.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        WHERE (t.midtrans_order_id = ? OR t.pelunasan_order_id = ?)
      `;

      const queryParams = [order_id, order_id];

      if (user_id) {
        query += ` AND t.user_id = ?`;
        queryParams.push(user_id);
      }

      query += ` GROUP BY t.id`;

      const [results] = await pool.query(query, queryParams);

      if (results.length === 0) {
        throw {
          status: 404,
          source: 'local',
          message: "Transaksi tidak ditemukan di sistem",
          details: `Order ID: ${order_id}`
        };
      }

      return results[0];

    } catch (error) {
      if (error.source === 'local') {
        throw error;
      }
      throw {
        status: 500,
        message: "Gagal mengambil data transaksi lokal",
        details: error.message
      };
    }
  }

  mapMidtransStatus(midtransStatus) {
    const statusMapping = {
      'capture': 'success',
      'settlement': 'success',
      'success': 'success',
      'pending': 'pending',
      'deny': 'failed',
      'cancel': 'cancelled',
      'expire': 'expired',
      'failed': 'failed',
      'refund': 'refunded',
      'partial_refund': 'partial_refund',
      'chargeback': 'chargeback'
    };

    return statusMapping[midtransStatus] || 'unknown';
  }

async handleWebhook(webhookData) {
   console.log('[TransaksiService] handleWebhook started', webhookData);
   const conn = await pool.getConnection();
   try {
       // Validate Midtrans notification
       validateMidtransNotification(webhookData);
       
       const { order_id, transaction_status, gross_amount, status_code, signature_key } = webhookData;

       // Verify transaction status
       let newStatus;
       if (MIDTRANS_STATUS.PAYMENT.SUCCESS.includes(transaction_status)) {
           newStatus = 'success';
       } else if (MIDTRANS_STATUS.PAYMENT.FAILED.includes(transaction_status)) {
           newStatus = 'failed';
       } else if (MIDTRANS_STATUS.PAYMENT.REFUND.includes(transaction_status)) {
           newStatus = 'refunded';
       } else {
           newStatus = 'pending';
       }

       // Get transaction with user email and booking details
       const [transaksiResult] = await conn.query(
           `SELECT t.*, u.email, b.tanggal, b.jam_mulai, b.jam_selesai, 
            GROUP_CONCAT(l.nama SEPARATOR ', ') as layanan_nama
            FROM transaksi t
            JOIN users u ON t.user_id = u.id
            JOIN booking b ON t.booking_id = b.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            WHERE t.midtrans_order_id = ? OR t.pelunasan_order_id = ?
            GROUP BY t.id`,
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

           // Send email receipt
           const emailSubject = paymentStatus === 'paid' ? 
               'Pembayaran Berhasil - Booking Salon' : 
               'Pembayaran DP Berhasil - Booking Salon';

           const emailHtml = await transactionReceiptTemplate({
               booking_number: transaksi.booking_number,
               paymentStatus,
               layanan_nama: transaksi.layanan_nama,
               tanggal: transaksi.tanggal,
               jam_mulai: transaksi.jam_mulai,
               jam_selesai: transaksi.jam_selesai,
               gross_amount,
               total_harga: transaksi.total_harga,
               newPaidAmount
           });

           await sendEmail(
               transaksi.email,
               emailSubject,
               'Pembayaran anda telah berhasil',
               emailHtml
           );
       } else if (transaction_status === "expired" || transaction_status === "cancelled" || transaction_status === "deny") {
           // Soft delete: update status instead of deleting
           let softDeleteStatus = 'cancelled';
           if (transaction_status === "expired") softDeleteStatus = 'expired';
           if (transaction_status === "deny") softDeleteStatus = 'failed';
           await conn.query(
               `UPDATE transaksi SET status = ? WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`, 
               [softDeleteStatus, order_id, order_id]
           );
       }

       await conn.commit();
       console.log('[TransaksiService] handleWebhook success', { order_id: webhookData.order_id });
       return { message: "Webhook processed successfully" };
   } catch (err) {
       console.error('[TransaksiService] handleWebhook error:', err);
       await conn.rollback();
       
       // Special handling for Midtrans-specific errors
       if (err.message.includes('Midtrans')) {
           throw { 
               status: 400, 
               message: "Invalid Midtrans notification",
               details: err.message
           };
       }
       throw err;
   } finally {
       conn.release();
   }
}

async payRemaining(transaksi_id, user_id) {
   console.log('[TransaksiService] payRemaining started', { transaksi_id, user_id });
   const conn = await pool.getConnection();
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
           customer_details: { user_id }
       });

       await conn.query(
           `UPDATE transaksi SET pelunasan_order_id = ? WHERE id = ?`,
           [pelunasanOrderId, transaksi_id]
       );

       console.log('[TransaksiService] payRemaining success', { transaksi_id, pelunasan_order_id: pelunasanOrderId });
       return {
           message: "Silakan lanjutkan pelunasan",
           order_id: pelunasanOrderId,
           pelunasan_order_id: pelunasanOrderId,
           snap_url: snapResponse.redirect_url,
           sisa_pembayaran: sisaPembayaran,
           original_order_id: transaksi.midtrans_order_id
       };
   } catch (err) {
       console.error('[TransaksiService] payRemaining error:', err);
       await conn.rollback();
       throw err;
   } finally {
       conn.release();
   }
}

async getUserTransactions(user_id) {
   try {
       const [results] = await pool.query(`
           SELECT 
               t.id,
               t.booking_number,
               t.midtrans_order_id AS order_id,
               t.pelunasan_order_id,
               t.total_harga,
               t.paid_amount,
               t.dp_amount,
               t.status AS transaction_status,
               t.payment_status,
               t.created_at AS transaction_date,
               t.updated_at AS last_updated,
               k.nama AS metode_pembayaran,
               b.tanggal AS booking_date,
               b.jam_mulai,
               b.jam_selesai,
               b.status AS booking_status,
               GROUP_CONCAT(l.nama ORDER BY l.nama SEPARATOR ', ') AS layanan_nama
           FROM transaksi t
           FORCE INDEX (idx_user_status) /* Force using composite index */
           JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
           JOIN booking b ON t.booking_id = b.id
           JOIN booking_layanan bl USE INDEX (booking_id_idx) ON b.id = bl.booking_id
           JOIN layanan l ON bl.layanan_id = l.id
           WHERE t.user_id = ?
           AND t.status NOT IN ('expired', 'cancelled', 'failed')
           AND b.tanggal >= CURDATE() - INTERVAL 3 MONTH
           GROUP BY t.id
           ORDER BY 
               CASE t.status 
                   WHEN 'pending' THEN 1
                   WHEN 'processing' THEN 2
                   WHEN 'completed' THEN 3
                   ELSE 4 
               END,
               b.tanggal DESC,
               t.created_at DESC
       `, [user_id]);
       
       return results;
   } catch (err) {
       throw {
           status: 500,
           message: "Gagal mengambil data transaksi",
           details: err.message
       };
   }
}

async handleExpiredTransactions() {
   const conn = await pool.getConnection();
   try {
       const [expiredTransactions] = await conn.query(
           `SELECT id FROM transaksi 
            WHERE status = 'pending' 
            AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
       );

       for (const trans of expiredTransactions) {
           await conn.query(
               `UPDATE transaksi SET status = 'expired' WHERE id = ?`,
               [trans.id]
           );
       }
   } finally {
       conn.release();
   }
}
}

module.exports = new TransaksiService();

