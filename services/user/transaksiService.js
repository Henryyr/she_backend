const { pool } = require('../../db');
const { snap, validateMidtransNotification } = require('../../config/midtrans');
const NodeCache = require('node-cache');
const { addToQueue } = require('../../utils/queue');

// Cache untuk menyimpan status transaksi final (settlement, expire, dll.)
// stdTTL: 3600 detik = 1 jam
const transactionCache = new NodeCache({ stdTTL: 3600 });
const userCache = new NodeCache({ stdTTL: 60 });

const retryOperation = async (fn, operationName, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Retry] Operasi '${operationName}' gagal. Mencoba lagi dalam ${delay}ms... (${retries} percobaan tersisa)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(fn, operationName, retries - 1, delay * 2); // Jeda digandakan
    } else {
      console.error(`[Retry] Operasi '${operationName}' gagal setelah semua percobaan.`);
      throw error;
    }
  }
};

class TransaksiService {
  async getTransactionStatus (order_id, user_id = null) {
    const cacheKey = `status_${order_id}`;
    const cachedTransaction = transactionCache.get(cacheKey);

    if (cachedTransaction) {
      console.log(`[TransaksiService] Mengembalikan status dari cache untuk pesanan ${order_id}`);
      return cachedTransaction;
    }

    console.log('[TransaksiService] getTransactionStatus started', { order_id, user_id });

    try {
      // [OPTIMASI] Menjalankan pemanggilan I/O (API & DB) secara paralel.
      // Ini akan lebih cepat daripada menjalankannya satu per satu (sekuensial).
      const [midtransResponse, localTransaction] = await Promise.all([
        this.fetchMidtransStatus(order_id),
        this.getLocalTransactionData(order_id, user_id)
      ]);

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

      const finalStatuses = ['settlement', 'capture', 'expire', 'cancel', 'deny', 'failed'];
      if (finalStatuses.includes(midtransResponse.transaction_status)) {
        transactionCache.set(cacheKey, combinedData);
        console.log(`[TransaksiService] Status final untuk pesanan ${order_id} disimpan di cache.`);
      }

      console.log('[TransaksiService] getTransactionStatus success', { order_id });
      return combinedData;
    } catch (error) {
      console.error('[TransaksiService] getTransactionStatus error:', error);
      const status = error.status || 500;
      const message = error.message || 'Gagal mengambil status transaksi';
      throw { status, message, details: error.details };
    }
  }

  async fetchMidtransStatus (order_id) {
    try {
      const response = await snap.transaction.status(order_id);
      return response;
    } catch (error) {
      console.error('[TransaksiService] fetchMidtransStatus error:', error);
      if (error.status_code === 404) {
        throw { status: 404, source: 'midtrans', message: 'Transaksi tidak ditemukan di Midtrans', details: error };
      }
      throw { status: error.status_code || 500, message: 'Gagal mengambil data dari Midtrans', details: error.message || error };
    }
  }

  async getLocalTransactionData (order_id, user_id = null) {
    try {
      let query = `
            SELECT 
                t.id, b.booking_number, t.midtrans_order_id, t.pelunasan_order_id,
                t.total_harga, t.paid_amount, t.dp_amount, t.status AS transaction_status,
                t.payment_status, t.created_at, t.updated_at, t.user_id,
                k.nama AS metode_pembayaran, b.tanggal AS booking_date, b.jam_mulai,
                b.jam_selesai, b.status AS booking_status, u.fullname AS user_name,
                u.email AS user_email, GROUP_CONCAT(l.nama ORDER BY l.nama SEPARATOR ', ') AS layanan_nama
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
        throw { status: 404, source: 'local', message: 'Transaksi tidak ditemukan di sistem', details: `Order ID: ${order_id}` };
      }
      const result = results[0];
      result.order_id = result.booking_number;
      return result;
    } catch (error) {
      if (error.source === 'local') throw error;
      throw { status: 500, message: 'Gagal mengambil data transaksi lokal', details: error.message };
    }
  }

  mapMidtransStatus (midtransStatus) {
    const statusMapping = {
      capture: 'success',
      settlement: 'success',
      success: 'success',
      pending: 'pending',
      deny: 'failed',
      cancel: 'cancelled',
      expire: 'expired',
      failed: 'failed',
      refund: 'refunded',
      partial_refund: 'partial_refund',
      chargeback: 'chargeback'
    };
    return statusMapping[midtransStatus] || 'unknown';
  }

  async createTransaction (booking_id, kategori_transaksi_id, is_dp, user_id) {
    console.log('[TransaksiService] createTransaction started', { booking_id, kategori_transaksi_id, is_dp, user_id });
    const conn = await pool.getConnection();
    try {
      // [OPTIMASI] Pindahkan validasi dan persiapan data di luar transaksi DB
      const [bookingResult] = await conn.query(
                `SELECT b.id, b.total_harga, b.final_price, b.status, b.voucher_id, b.discount,
                v.code as voucher_code, v.description as voucher_name, b.user_id
                FROM booking b
                LEFT JOIN vouchers v ON b.voucher_id = v.id
                WHERE b.id = ?`,
                [booking_id]
      );

      if (bookingResult.length === 0) throw { status: 404, message: 'Booking tidak ditemukan' };

      const { final_price, status: bookingStatus, voucher_id, discount, voucher_code, voucher_name, user_id: booking_user_id } = bookingResult[0];
      const total_harga = final_price;

      if (bookingStatus === 'completed') throw { status: 400, message: 'Booking sudah dibayar' };

      const [existingTransaction] = await conn.query(
        'SELECT id, payment_status, status, dp_amount FROM transaksi WHERE booking_id = ? AND status NOT IN (\'failed\', \'expired\', \'cancelled\')',
        [booking_id]
      );

      if (existingTransaction.length > 0) {
        const existing = existingTransaction[0];
        if (existing.payment_status === 'paid') throw { status: 400, message: 'Booking ini sudah dibayar penuh' };
        if (existing.dp_amount > 0) throw { status: 400, message: 'DP untuk booking ini sudah dibuat' };
      }

      const order_id = `BKG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(booking_id).padStart(3, '0')}-${Math.random().toString(36).substr(2, 5)}`;
      const booking_number = order_id;

      let amountToPay = total_harga; let dp_amount = 0; let snapResponse = null;
      const payment_status = kategori_transaksi_id === 1 ? 'unpaid' : 'dp';

      // [OPTIMASI] Buat transaksi Midtrans SEBELUM memulai transaksi DB
      // Ini mencegah koneksi DB menunggu proses network yang bisa lambat.
      if (kategori_transaksi_id !== 1) { // Non-cash
        dp_amount = Math.round(total_harga * 0.3);
        amountToPay = dp_amount;

        const createMidtransTx = () => snap.createTransaction({
          transaction_details: { order_id, gross_amount: amountToPay },
          item_details: [{ id: booking_id, price: amountToPay, quantity: 1, name: 'Booking Salon (DP 30%)', brand: 'Salon', category: 'Perawatan' }],
          customer_details: { user_id }
        });

        try {
          console.log(`[TransaksiService] Mencoba membuat transaksi Midtrans untuk order_id: ${order_id}`);
          snapResponse = await retryOperation(createMidtransTx, 'Create Midtrans Transaction');
          console.log(`[TransaksiService] Berhasil membuat transaksi Midtrans untuk order_id: ${order_id}`);
        } catch (midtransError) {
          console.error(`[TransaksiService] Gagal membuat transaksi Midtrans untuk order_id: ${order_id}`, midtransError);
          throw { status: 503, message: 'Gagal menghubungi payment gateway. Coba beberapa saat lagi.' };
        }
      }

      // Transaksi DB sekarang hanya untuk menulis, jadi lebih cepat.
      await conn.beginTransaction();

      const [result] = await conn.query(
        'INSERT INTO transaksi (user_id, booking_id, total_harga, paid_amount, dp_amount, kategori_transaksi_id, status, midtrans_order_id, payment_status, booking_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, booking_id, total_harga, 0, dp_amount, kategori_transaksi_id, 'pending', order_id, payment_status, booking_number]
      );

      if (voucher_id) {
        await conn.query('INSERT IGNORE INTO voucher_usages (user_id, voucher_id) VALUES (?, ?)', [booking_user_id, voucher_id]);
      }

      await conn.commit();

      let voucher = null;
      if (voucher_id && discount > 0) {
        voucher = { id: voucher_id, code: voucher_code, name: voucher_name, discount: Math.round(discount), message: `Voucher berhasil diterapkan dengan diskon sebesar Rp ${Math.round(discount).toLocaleString('id-ID')}.` };
      }

      return {
        message: 'Transaksi dibuat',
        transaksi_id: result.insertId,
        order_id,
        midtrans_order_id: order_id,
        status: 'pending',
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
      await conn.rollback(); // Rollback tetap penting jika ada error di dalam blok try-catch
      if (err.ApiResponse && err.ApiResponse.error_messages) throw { status: 400, message: 'Gagal membuat transaksi', details: err.ApiResponse.error_messages };
      if (err.status) throw err;
      throw { status: 500, message: 'Terjadi kesalahan saat membuat transaksi', details: process.env.NODE_ENV === 'development' ? err.message : undefined };
    } finally {
      conn.release();
    }
  }

  async handleWebhook (webhookData) {
    console.log('[TransaksiService] handleWebhook started', webhookData);
    const conn = await pool.getConnection();
    try {
      validateMidtransNotification(webhookData);
      const { order_id, transaction_status, gross_amount } = webhookData;
      await conn.beginTransaction();

      const [transaksiResult] = await conn.query(
                `SELECT t.*, b.id AS booking_id, b.tanggal, b.jam_mulai, b.jam_selesai,
                u.email AS email, GROUP_CONCAT(l.nama ORDER BY l.nama SEPARATOR ', ') AS layanan_nama
                FROM transaksi t
                JOIN booking b ON t.booking_id = b.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN booking_layanan bl ON b.id = bl.booking_id
                LEFT JOIN layanan l ON bl.layanan_id = l.id
                WHERE (t.midtrans_order_id = ? OR t.pelunasan_order_id = ?)
                GROUP BY t.id`,
                [order_id, order_id]
      );

      if (transaksiResult.length === 0) throw { status: 404, message: 'Transaksi tidak ditemukan' };

      const transaksi = transaksiResult[0];

      if (transaction_status === 'settlement' || transaction_status === 'capture') {
        const amountPaid = parseFloat(gross_amount);
        const updatedPaidAmount = (parseFloat(transaksi.paid_amount) || 0) + amountPaid;

        let newPaymentStatus = 'unpaid';
        if (updatedPaidAmount >= parseFloat(transaksi.total_harga)) {
          newPaymentStatus = 'paid';
        } else if (updatedPaidAmount >= parseFloat(transaksi.dp_amount)) {
          newPaymentStatus = 'DP';
        }

        await conn.query(
          'UPDATE transaksi SET paid_amount = ?, payment_status = ?, status = \'pending\', updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [updatedPaidAmount, newPaymentStatus, transaksi.id]
        );

        await conn.commit();
        console.log(`[TransaksiService] Webhook berhasil, data tersimpan di DB untuk order_id: ${order_id}`);
        console.log(`[TransaksiService] Menambahkan tugas 'send-payment-receipt' ke antrian untuk order_id: ${order_id}`);

        addToQueue('send-payment-receipt', {
          transaksi,
          webhookData
        });

        return { message: 'Webhook berhasil diproses. Notifikasi email akan dikirim di latar belakang.' };
      } else if (['expired', 'cancel', 'deny', 'cancelled'].includes(transaction_status)) {
        const newStatus = { expired: 'expired', cancel: 'cancelled', cancelled: 'cancelled', deny: 'failed' }[transaction_status] || 'failed';
        await conn.query('UPDATE transaksi SET status = ? WHERE id = ?', [newStatus, transaksi.id]);
        if (transaksi.voucher_id) {
          await conn.query('DELETE FROM voucher_usages WHERE user_id = ? AND voucher_id = ?', [transaksi.user_id, transaksi.voucher_id]);
        }
      }

      await conn.commit();
      console.log('[TransaksiService] handleWebhook success (non-settlement)', { order_id });
      return { message: 'Webhook processed successfully' };
    } catch (err) {
      console.error('[TransaksiService] handleWebhook error:', err);
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async payRemaining (transaksi_id, user_id) {
    console.log('[TransaksiService] payRemaining started', { transaksi_id, user_id });
    // [OPTIMASI] Tidak perlu full DB transaction (BEGIN/COMMIT) untuk satu query UPDATE.
    // Tapi kita tetap butuh koneksi untuk membaca dan menulis.
    const conn = await pool.getConnection();
    try {
      const [transaksiResult] = await conn.query(
        'SELECT id, booking_id, total_harga, paid_amount, dp_amount, midtrans_order_id FROM transaksi WHERE id = ? AND user_id = ?',
        [transaksi_id, user_id]
      );

      if (transaksiResult.length === 0) throw { status: 404, message: 'Transaksi tidak ditemukan' };

      const transaksi = transaksiResult[0];

      if (transaksi.dp_amount === 0 || parseFloat(transaksi.paid_amount) < parseFloat(transaksi.dp_amount)) {
        throw { status: 400, message: 'DP belum dibayar, pelunasan tidak bisa dilakukan' };
      }

      const sisaPembayaran = parseFloat(transaksi.total_harga) - parseFloat(transaksi.paid_amount);
      if (sisaPembayaran <= 0) throw { status: 400, message: 'Transaksi sudah lunas' };

      const pelunasanOrderId = `${transaksi.midtrans_order_id}-PELUNASAN`;

      // [OPTIMASI] Buat transaksi Midtrans SEBELUM update DB.
      const snapResponse = await snap.createTransaction({
        transaction_details: { order_id: pelunasanOrderId, gross_amount: sisaPembayaran },
        item_details: [{ id: transaksi.booking_id, price: sisaPembayaran, quantity: 1, name: 'Pelunasan Sisa Pembayaran', brand: 'Salon', category: 'Perawatan' }],
        customer_details: { user_id }
      });

      // Setelah snap berhasil, baru update DB.
      await conn.query('UPDATE transaksi SET pelunasan_order_id = ? WHERE id = ?', [pelunasanOrderId, transaksi_id]);

      console.log('[TransaksiService] payRemaining success', { transaksi_id, pelunasan_order_id: pelunasanOrderId });
      return { message: 'Silakan lanjutkan pelunasan', order_id: pelunasanOrderId, pelunasan_order_id: pelunasanOrderId, snap_url: snapResponse.redirect_url, sisa_pembayaran: sisaPembayaran, original_order_id: transaksi.midtrans_order_id };
    } catch (err) {
      console.error('[TransaksiService] payRemaining error:', err);
      // Tidak perlu rollback karena tidak ada transaction block, tapi error handling tetap penting.
      throw err;
    } finally {
      conn.release();
    }
  }

  async getUserTransactions (user_id) {
    const cacheKey = `user_transactions_${user_id}`;
    const cachedData = userCache.get(cacheKey);

    if (cachedData) {
      console.log(`[TransaksiService] Mengembalikan daftar transaksi dari cache untuk user ${user_id}`);
      return cachedData;
    }

    try {
      const [results] = await pool.query(`
                SELECT 
                    t.id, t.booking_number, t.midtrans_order_id AS order_id, t.pelunasan_order_id,
                    t.total_harga, t.paid_amount, t.dp_amount, t.status AS transaction_status,
                    t.payment_status, t.created_at AS transaction_date, t.updated_at AS last_updated,
                    k.nama AS metode_pembayaran, b.tanggal AS booking_date, b.jam_mulai, b.jam_selesai,
                    b.status AS booking_status, GROUP_CONCAT(l.nama ORDER BY l.nama SEPARATOR ', ') AS layanan_nama
                FROM transaksi t
                FORCE INDEX (idx_user_status)
                JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
                JOIN booking b ON t.booking_id = b.id
                JOIN booking_layanan bl USE INDEX (booking_id_idx) ON b.id = bl.booking_id
                JOIN layanan l ON bl.layanan_id = l.id
                WHERE t.user_id = ?
                AND t.status NOT IN ('expired', 'cancelled', 'failed')
                AND b.tanggal >= CURDATE() - INTERVAL 3 MONTH
                GROUP BY t.id
                ORDER BY CASE t.status WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END, b.tanggal DESC, t.created_at DESC
            `, [user_id]);

      const sanitizedResults = results.map(row => {
        const safeRow = { ...row };
        if ('va_numbers' in safeRow) safeRow.va_numbers = '[MASKED]';
        if ('payment_amounts' in safeRow) safeRow.payment_amounts = '[MASKED]';
        return safeRow;
      });

      // Dan baris ini juga akan berfungsi
      userCache.set(cacheKey, sanitizedResults);

      return sanitizedResults;
    } catch (err) {
      throw { status: 500, message: 'Gagal mengambil data transaksi', details: err.message };
    }
  }
}

module.exports = new TransaksiService();
