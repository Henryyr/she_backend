const { pool } = require('../../db');
const paginateQuery = require('../../helpers/paginateQuery');

const getAllBookings = async (page = 1, limit = 10, status, startDate, endDate) => {
  let sql = `
    SELECT 
        b.id,
        u.fullname AS customer,
        DATE_FORMAT(b.tanggal, '%d %b %Y') AS date,
        CONCAT(TIME_FORMAT(b.jam_mulai, '%H:%i'), ' - ', TIME_FORMAT(b.jam_selesai, '%H:%i')) AS time,
        GROUP_CONCAT(l.nama SEPARATOR ', ') AS services,
        b.status,
        COALESCE(MAX(t.total_harga), b.total_harga) AS total_harga,
        COALESCE(MAX(t.dp_amount), 0) AS dp_amount,
        COALESCE(MAX(t.paid_amount), 0) AS paid_amount,
        (COALESCE(MAX(t.total_harga), b.total_harga) - IFNULL(MAX(t.paid_amount), 0)) AS sisa_bayar,
        MAX(t.payment_status) AS payment_status
    FROM booking b
    JOIN users u ON b.user_id = u.id
    JOIN booking_layanan bl ON b.id = bl.booking_id
    JOIN layanan l ON bl.layanan_id = l.id
    LEFT JOIN transaksi t ON t.booking_id = b.id
`;
  const whereClauses = [];
  const params = [];

  if (status) {
    whereClauses.push('LOWER(TRIM(b.status)) = ?');
    params.push(status.trim().toLowerCase());
  }
  if (startDate) {
    whereClauses.push('DATE(b.tanggal) >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('DATE(b.tanggal) <= ?');
    params.push(endDate);
  }
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  sql += `
        GROUP BY 
            b.id, 
            u.fullname, 
            b.tanggal, 
            b.jam_mulai, 
            b.jam_selesai, 
            b.status
        ORDER BY b.created_at DESC
    `;

  let countSql = 'SELECT COUNT(DISTINCT b.id) as total FROM booking b';
  const countWhereClauses = [];
  const countParams = [];

  if (status) {
    countWhereClauses.push('LOWER(TRIM(b.status)) = ?');
    countParams.push(status.trim().toLowerCase());
  }
  if (startDate) {
    countWhereClauses.push('DATE(b.tanggal) >= ?');
    countParams.push(startDate);
  }
  if (endDate) {
    countWhereClauses.push('DATE(b.tanggal) <= ?');
    countParams.push(endDate);
  }
  if (countWhereClauses.length > 0) {
    countSql += ' WHERE ' + countWhereClauses.join(' AND ');
  }

  const { data, pagination } = await paginateQuery(pool, sql, countSql, params, countParams, page, limit);

  // Format output agar Paid bisa langsung dipakai di frontend
  const bookings = data.map(row => ({
    id: row.id,
    customer: row.customer,
    date: row.date,
    time: row.time,
    services: row.services,
    status: row.status,
    total: row.total_harga,
    dp: row.dp_amount,
    paid: row.paid_amount, // <- ini tampilkan di frontend
    sisa: row.sisa_bayar,
    payment_status: row.payment_status
  }));

  return { bookings, pagination };
};

const getBookingsByUserId = async (userId, page = 1, limit = 10, status, startDate, endDate) => {
  let sql = `
        SELECT 
            b.id,
            u.fullname as customer,
            DATE_FORMAT(b.tanggal, '%d %b %Y') as date,
            TIME_FORMAT(b.jam_mulai, '%H:%i') as start_time,
            TIME_FORMAT(b.jam_selesai, '%H:%i') as end_time,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as services,
            b.status
        FROM booking b
        JOIN users u ON b.user_id = u.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        WHERE b.user_id = ?
    `;
  const params = [userId];

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  if (startDate) {
    sql += ' AND DATE(b.tanggal) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND DATE(b.tanggal) <= ?';
    params.push(endDate);
  }

  sql += `
        GROUP BY b.id
        ORDER BY b.created_at DESC
    `;

  let countSql = 'SELECT COUNT(DISTINCT b.id) as total FROM booking b WHERE b.user_id = ?';
  const countParams = [userId];
  if (status) {
    countSql += ' AND b.status = ?';
    countParams.push(status);
  }
  if (startDate) {
    countSql += ' AND DATE(b.tanggal) >= ?';
    countParams.push(startDate);
  }
  if (endDate) {
    countSql += ' AND DATE(b.tanggal) <= ?';
    countParams.push(endDate);
  }

  const { data, pagination } = await paginateQuery(pool, sql, countSql, params, countParams, page, limit);
  return { bookings: data, pagination };
};

const getBookingById = async (id) => {
  try {
    const [bookings] = await pool.query(`
            SELECT 
                b.*,
                u.fullname as customer_name,
                u.phone_number as customer_phone,
                u.email as customer_email,
                GROUP_CONCAT(DISTINCT l.nama SEPARATOR ', ') as services,
                GROUP_CONCAT(DISTINCT l.id) as service_ids
            FROM booking b
            JOIN users u ON b.user_id = u.id
            JOIN booking_layanan bl ON b.id = bl.booking_id
            JOIN layanan l ON bl.layanan_id = l.id
            LEFT JOIN booking_colors bc ON b.id = bc.booking_id
            LEFT JOIN hair_colors hc ON bc.color_id = hc.id
            LEFT JOIN hair_products hp ON hc.product_id = hp.id
            LEFT JOIN product_brands pb ON hp.brand_id = pb.id
            WHERE b.id = ?
            GROUP BY b.id
        `, [id]);

    if (bookings.length === 0) {
      return null;
    }

    const booking = bookings[0];

    // Get product details if any
    const [productDetails] = await pool.query(`
            SELECT 
                'hair_color' as type,
                hc.id as color_id,
                hc.nama as color_name,
                pb.nama as brand_name,
                hp.harga_dasar,
                hc.tambahan_harga
            FROM booking_colors bc
            JOIN hair_colors hc ON bc.color_id = hc.id
            JOIN hair_products hp ON hc.product_id = hp.id
            JOIN product_brands pb ON hp.brand_id = pb.id
            WHERE bc.booking_id = ?
        `, [id]);

    if (productDetails.length > 0) {
      booking.products = productDetails;
    }

    return booking;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw new Error(`Failed to retrieve booking: ${error.message}`);
  }
};

const updateBooking = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { tanggal, jam_mulai, jam_selesai, status, special_request } = data;

    // First check if booking exists
    const [booking] = await connection.query(
      'SELECT * FROM booking WHERE id = ?',
      [id]
    );

    if (booking.length === 0) {
      return null;
    }

    // Update basic booking information
    await connection.query(
            `UPDATE booking 
             SET tanggal = COALESCE(?, tanggal),
                 jam_mulai = COALESCE(?, jam_mulai),
                 jam_selesai = COALESCE(?, jam_selesai),
                 status = COALESCE(?, status),
                 special_request = COALESCE(?, special_request),
                 updated_at = NOW()
             WHERE id = ?`,
            [tanggal, jam_mulai, jam_selesai, status, special_request, id]
    );

    // If service IDs have been provided, update them
    if (data.service_ids && Array.isArray(data.service_ids)) {
      // Delete existing service relations
      await connection.query(
        'DELETE FROM booking_layanan WHERE booking_id = ?',
        [id]
      );

      // Insert new service relations
      for (const serviceId of data.service_ids) {
        await connection.query(
          'INSERT INTO booking_layanan (booking_id, layanan_id) VALUES (?, ?)',
          [id, serviceId]
        );
      }
    }

    await connection.commit();

    // Get the updated booking
    const updatedBooking = await getBookingById(id);
    return updatedBooking;
  } catch (error) {
    await connection.rollback();
    console.error('Error updating booking:', error);
    throw new Error(`Failed to update booking: ${error.message}`);
  } finally {
    connection.release();
  }
};

const updateBookingStatus = async (id, status) => {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('Status tidak valid');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get current booking status
    const [currentBooking] = await connection.query(
      'SELECT status FROM booking WHERE id = ?',
      [id]
    );

    if (currentBooking.length === 0) {
      return null;
    }

    const currentStatus = currentBooking[0].status;

    // Update booking status
    const [result] = await connection.query(
      'UPDATE booking SET status = ? WHERE id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return null;
    }

    // Jika status berubah menjadi cancelled, restore stok
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      try {
        console.log(`[AdminBookingService] Restore stok untuk booking yang dibatalkan id=${id}`);
        const stockService = require('./stockService');
        await stockService.restoreStockByBookingId(id, connection);
      } catch (restoreError) {
        console.error(`[AdminBookingService] Gagal restore stok untuk booking_id=${id}:`, restoreError);
        // Jangan throw error, karena booking sudah dibatalkan
      }
    }

    // Jika status completed, update juga status transaksi terkait
    if (status === 'completed') {
      await connection.query(
            `UPDATE transaksi 
             SET 
                status = 'completed', 
                payment_status = 'paid',
                paid_amount = total_harga 
             WHERE booking_id = ?`,
            [id]
      );
    }

    await connection.commit();
    return { id, status };
  } catch (error) {
    await connection.rollback();
    console.error('Error updating booking status:', error);
    throw new Error(`Failed to update booking status: ${error.message}`);
  } finally {
    connection.release();
  }
};

const deleteBooking = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if booking exists
    const [booking] = await connection.query(
      'SELECT * FROM booking WHERE id = ?',
      [id]
    );

    if (booking.length === 0) {
      return null;
    }

    // Restore stok sebelum menghapus booking
    try {
      console.log(`[AdminBookingService] Restore stok untuk booking yang dihapus id=${id}`);
      const stockService = require('./stockService');
      await stockService.restoreStockByBookingId(id, connection);
    } catch (restoreError) {
      console.error(`[AdminBookingService] Gagal restore stok untuk booking_id=${id}:`, restoreError);
      // Jangan throw error, karena booking akan dihapus
    }

    // Delete related records first
    await connection.query('DELETE FROM booking_layanan WHERE booking_id = ?', [id]);
    await connection.query('DELETE FROM booking_colors WHERE booking_id = ?', [id]);
    await connection.query('DELETE FROM booking_smoothing WHERE booking_id = ?', [id]);
    await connection.query('DELETE FROM booking_keratin WHERE booking_id = ?', [id]);

    // Delete the booking itself
    await connection.query('DELETE FROM booking WHERE id = ?', [id]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting booking:', error);
    throw new Error(`Failed to delete booking: ${error.message}`);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllBookings,
  getBookingsByUserId,
  getBookingById,
  updateBooking,
  deleteBooking,
  updateBookingStatus
};
