const { pool } = require('../../db');
const { sendEmail, sendInvoice } = require('./emailService'); // <-- tambahkan sendInvoice
const transactionReceiptTemplate = require('../../html/transactionReceipt');
const { snap, MIDTRANS_STATUS, validateMidtransNotification } = require('../../config/midtrans');

class TransaksiService {
async getTransactionStatus(order_id, user_id = null) {
    console.log('[TransaksiService] getTransactionStatus started', { order_id, user_id });
    
    try {
      const midtransResponse = await this.fetchMidtransStatus(order_id);
      const localTransaction = await this.getLocalTransactionData(order_id, user_id);

      // Mask sensitive data from midtransResponse
      const safeMidtransData = {
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
        va_numbers: midtransResponse.va_numbers ? '[MASKED]' : null,
        payment_amounts: midtransResponse.payment_amounts ? '[MASKED]' : null
      };

      const combinedData = {
        midtrans_data: safeMidtransData,
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
  try {
    const response = await snap.transaction.status(order_id);
    return response;
  } catch (error) {
    console.error('[TransaksiService] fetchMidtransStatus error:', error);

    if (error.status_code === 404) {
      throw {
        status: 404,
        source: 'midtrans',
        message: "Transaksi tidak ditemukan di Midtrans",
        details: error
      };
    }

    if (error.status_code === 401) {
      throw {
        status: 401,
        message: "Unauthorized - Periksa server key Midtrans",
        details: "Invalid authorization"
      };
    }

    throw {
      status: error.status_code || 500,
      message: "Gagal mengambil data dari Midtrans",
      details: error.message || error
    };
  }
}


async getLocalTransactionData(order_id, user_id = null) {
  try {
    let query = `
      SELECT 
        t.id,
        b.booking_number,         -- ambil dari booking
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
        u.fullname AS user_name,
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
      query += ' AND t.user_id = ?';
      queryParams.push(user_id);
    }

    query += ' GROUP BY t.id';

    const [results] = await pool.query(query, queryParams);

    if (results.length === 0) {
      throw {
        status: 404,
        source: 'local',
        message: "Transaksi tidak ditemukan di sistem",
        details: `Order ID: ${order_id}`
      };
    }

    const result = results[0];
    result.order_id = result.booking_number;  // <-- ini bagian yang kamu minta
    return result;

  } catch (error) {
    if (error.source === 'local') throw error;

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

async createTransaction(booking_id, kategori_transaksi_id, is_dp, user_id) {
    console.log('[TransaksiService] createTransaction started', { booking_id, kategori_transaksi_id, is_dp, user_id });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Ambil data booking beserta info voucher (LEFT JOIN voucher)
      const [bookingResult] = await conn.query(
        `SELECT b.id, b.total_harga, b.final_price, b.status, b.voucher_id, b.discount,
          v.code as voucher_code, v.description as voucher_name, b.user_id
         FROM booking b
         LEFT JOIN vouchers v ON b.voucher_id = v.id
         WHERE b.id = ?`,
        [booking_id]
      );

      if (bookingResult.length === 0) {
        throw { status: 404, message: "Booking tidak ditemukan" };
      }

      const {
        final_price,
        status: bookingStatus,
        voucher_id,
        discount,
        voucher_code,
        voucher_name,
        user_id: booking_user_id
      } = bookingResult[0];

      const total_harga = final_price;

      if (bookingStatus === 'completed') {
        throw { status: 400, message: "Booking sudah dibayar" };
      }

      // Check existing transaction with more specific conditions
      const [existingTransaction] = await conn.query(
        `SELECT id, payment_status, status, dp_amount 
          FROM transaksi 
          WHERE booking_id = ? 
          AND status NOT IN ('failed', 'expired', 'cancelled')`,
        [booking_id]
      );

      if (existingTransaction.length > 0) {
        const existing = existingTransaction[0];
        if (existing.payment_status === 'paid') {
          throw { status: 400, message: "Booking ini sudah dibayar penuh" };
        }
        if (existing.dp_amount > 0) {
          throw { status: 400, message: "DP untuk booking ini sudah dibuat" };
        }
      }

      const order_id = `BKG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(booking_id).padStart(3, '0')}-${Math.random().toString(36).substr(2, 5)}`;
      const booking_number = order_id;

      let paid_amount = 0;
let transactionStatus = 'pending';
let payment_status = 'unpaid';
let snapResponse = null;
let amountToPay = total_harga;
let dp_amount = 0;

// Handle cash vs non-cash differently
if (kategori_transaksi_id === 1) { 
    paid_amount = 0; 
    transactionStatus = 'pending'; 
    payment_status = 'unpaid';
    dp_amount = 0;
    amountToPay = total_harga;
} else { 
    dp_amount = Math.round(total_harga * 0.3);
    amountToPay = dp_amount;
    payment_status = 'dp'; // <--- PATCH DI SINI

    const parameter = {
      transaction_details: { order_id, gross_amount: amountToPay },
      item_details: [{
        id: booking_id,
        price: amountToPay,
        quantity: 1,
        name: 'Booking Salon (DP 30%)',
        brand: "Salon",
        category: "Perawatan"
      }],
      customer_details: { user_id }
    };

    snapResponse = await snap.createTransaction(parameter);
}

      // Insert transaksi
      const [result] = await conn.query(
        `INSERT INTO transaksi (
            user_id, booking_id, total_harga, paid_amount, dp_amount, 
            kategori_transaksi_id, status, midtrans_order_id, payment_status, booking_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, booking_id, total_harga, paid_amount, dp_amount, 
          kategori_transaksi_id, transactionStatus, order_id, payment_status, booking_number]
      );

      await conn.commit();

      // PATCH: Insert voucher_usage setelah transaksi berhasil (DP atau Cash)
      if (voucher_id) {
        await pool.query(
          `INSERT IGNORE INTO voucher_usages (user_id, voucher_id) VALUES (?, ?)`,
          [booking_user_id, voucher_id]
        );
      }

      // Hanya tampilkan info voucher jika ada
      let voucher = null;
      if (voucher_id && discount > 0) {
        voucher = {
          id: voucher_id,
          code: voucher_code,
          name: voucher_name,
          discount: Math.round(discount),
          message: `Voucher berhasil diterapkan dengan diskon sebesar Rp ${Math.round(discount).toLocaleString('id-ID')}.`
        };
      }

      return {
        message: "Transaksi dibuat",
        transaksi_id: result.insertId,
        order_id: order_id,
        midtrans_order_id: order_id,
        status: transactionStatus,
        snap_url: snapResponse ? snapResponse.redirect_url : null,
        dp_amount,
        remaining_amount: total_harga - dp_amount,
        payment_status,
        total_harga,
        amount_to_pay: amountToPay,
        payment_method: kategori_transaksi_id === 1 ? 'Cash' : 'Online Payment (DP)',
        voucher
      };
    } catch (err) {
      console.error('[TransaksiService] createTransaction error:', err);
      await conn.rollback();

      if (err.ApiResponse && err.ApiResponse.error_messages) {
        throw {
          status: 400,
          message: "Gagal membuat transaksi",
          details: err.ApiResponse.error_messages
        };
      }
      if (err.status) {
        throw err;
      }
      throw {
        status: 500,
        message: "Terjadi kesalahan saat membuat transaksi",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      };
    } finally {
      conn.release();
    }
  }

  async handleWebhook(webhookData) {
    console.log('[TransaksiService] handleWebhook started', webhookData);
    const conn = await pool.getConnection();
    try {
      validateMidtransNotification(webhookData);

      const { order_id, transaction_status, gross_amount } = webhookData;

      // Get transaction with user email and booking details
      const [transaksiResult] = await conn.query(
        `SELECT t.*, u.email, b.tanggal, b.jam_mulai, b.jam_selesai, b.voucher_id, b.user_id as booking_user_id,
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
    const newPaidAmount = parseFloat(gross_amount);

    // Hanya ada dua status pembayaran di sistem kamu: DP atau unpaid
    let paymentStatus = 'DP'; // Tidak pernah 'paid'
    let newStatus = 'pending'; // Atau 'confirmed' jika ingin otomatis terkonfirmasi setelah DP

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

        // Voucher usage sudah dimasukkan di createTransaction (DP/Cash).
        // Tidak perlu repeat insert di sini.

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

        // Kirim invoice jika pembayaran sudah lunas
        if (paymentStatus === 'paid') {
          const invoiceHtml = await transactionReceiptTemplate({
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
          await sendInvoice(
            transaksi.email,
            transaksi.user_name || transaksi.email,
            invoiceHtml
          );
        }
      } else if (transaction_status === "expired" || transaction_status === "cancelled" || transaction_status === "deny") {
        let softDeleteStatus = 'cancelled';
        if (transaction_status === "expired") softDeleteStatus = 'expired';
        if (transaction_status === "deny") softDeleteStatus = 'failed';
        await conn.query(
          `UPDATE transaksi SET status = ? WHERE midtrans_order_id = ? OR pelunasan_order_id = ?`, 
          [softDeleteStatus, order_id, order_id]
        );

        // PATCH: Hapus voucher_usage jika transaksi dibatalkan/expired/deny
        if (transaksi.voucher_id) {
          await pool.query(
            `DELETE FROM voucher_usages WHERE user_id = ? AND voucher_id = ?`,
            [transaksi.booking_user_id, transaksi.voucher_id]
          );
        }
      }

      await conn.commit();
      console.log('[TransaksiService] handleWebhook success', { order_id: webhookData.order_id });
      return { message: "Webhook processed successfully" };
    } catch (err) {
      console.error('[TransaksiService] handleWebhook error:', err);
      await conn.rollback();
      if (err.message && err.message.includes('Midtrans')) {
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
       
       // Mask any sensitive fields if present (defensive)
       return results.map(row => {
           const safeRow = { ...row };
           if ('va_numbers' in safeRow) safeRow.va_numbers = '[MASKED]';
           if ('payment_amounts' in safeRow) safeRow.payment_amounts = '[MASKED]';
           return safeRow;
       });
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

