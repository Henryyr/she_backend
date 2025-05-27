const { pool } = require('../../db');
const paginateQuery = require('../../helpers/paginateQuery');

const getRecentTransactions = async (limit = 5) => {
    const [transactions] = await pool.query(`
        SELECT 
            t.id,
            u.fullname as name,
            DATE_FORMAT(t.created_at, '%d %b %Y') as date,
            CASE 
                WHEN t.status = 'completed' THEN 'Completed'
                WHEN t.status = 'pending' THEN 'Pending'
                ELSE CONCAT(UPPER(LEFT(t.status, 1)), LOWER(SUBSTRING(t.status, 2)))
            END as status
        FROM transaksi t
        JOIN users u ON t.user_id = u.id
        WHERE t.status NOT IN ('expired', 'cancelled', 'failed')
        ORDER BY t.created_at DESC
        LIMIT ?
    `, [limit]);
    return transactions;
};

const getAllTransactions = async (page = 1, limit = 10, status, startDate, endDate) => {
    let sql = `
        SELECT 
            t.id,
            u.fullname as name,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as keterangan,
            CONCAT(
                DATE_FORMAT(b.tanggal, '%d %b %Y'), ' - ',
                TIME_FORMAT(b.jam_mulai, '%H:%i'), ' WIB'
            ) as date_time,
            k.nama as type,
            CASE 
                WHEN t.status = 'completed' THEN 'Completed'
                WHEN t.status = 'pending' THEN 'Pending'
                ELSE CONCAT(UPPER(LEFT(t.status, 1)), LOWER(SUBSTRING(t.status, 2)))
            END as status
        FROM transaksi t
        JOIN users u ON t.user_id = u.id
        JOIN booking b ON t.booking_id = b.id
        JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
    `;
    let whereClauses = [];
    let params = [];

    if (status) {
        whereClauses.push('t.status = ?');
        params.push(status);
    }
    if (startDate) {
        whereClauses.push('DATE(t.created_at) >= ?');
        params.push(startDate);
    }
    if (endDate) {
        whereClauses.push('DATE(t.created_at) <= ?');
        params.push(endDate);
    }

    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += `
        GROUP BY t.id
        ORDER BY t.created_at DESC
    `;

    let countSql = `SELECT COUNT(DISTINCT t.id) as total FROM transaksi t`;
    let countWhereClauses = [];
    let countParams = [];

    if (status) {
        countWhereClauses.push('t.status = ?');
        countParams.push(status);
    }
    if (startDate) {
        countWhereClauses.push('DATE(t.created_at) >= ?');
        countParams.push(startDate);
    }
    if (endDate) {
        countWhereClauses.push('DATE(t.created_at) <= ?');
        countParams.push(endDate);
    }
    if (countWhereClauses.length > 0) {
        countSql += ' WHERE ' + countWhereClauses.join(' AND ');
    }

    const { data, pagination } = await paginateQuery(pool, sql, countSql, params, countParams, page, limit);
    return { transactions: data, pagination };
};

const getTransactionsByUserId = async (userId, page = 1, limit = 10, status, startDate, endDate) => {
    let sql = `
        SELECT 
            t.id,
            u.fullname as name,
            GROUP_CONCAT(l.nama SEPARATOR ', ') as keterangan,
            CONCAT(
                DATE_FORMAT(b.tanggal, '%d %b %Y'), ' - ',
                TIME_FORMAT(b.jam_mulai, '%H:%i'), ' WIB'
            ) as date_time,
            k.nama as type,
            CASE 
                WHEN t.status = 'completed' THEN 'Completed'
                WHEN t.status = 'pending' THEN 'Pending'
                ELSE CONCAT(UPPER(LEFT(t.status, 1)), LOWER(SUBSTRING(t.status, 2)))
            END as status
        FROM transaksi t
        JOIN users u ON t.user_id = u.id
        JOIN booking b ON t.booking_id = b.id
        JOIN kategori_transaksi k ON t.kategori_transaksi_id = k.id
        JOIN booking_layanan bl ON b.id = bl.booking_id
        JOIN layanan l ON bl.layanan_id = l.id
        WHERE t.user_id = ?
    `;
    let params = [userId];

    if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
    }
    if (startDate) {
        sql += ' AND DATE(t.created_at) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND DATE(t.created_at) <= ?';
        params.push(endDate);
    }

    sql += `
        GROUP BY t.id
        ORDER BY t.created_at DESC
    `;

    let countSql = `SELECT COUNT(DISTINCT t.id) as total FROM transaksi t WHERE t.user_id = ?`;
    let countParams = [userId];
    if (status) {
        countSql += ' AND t.status = ?';
        countParams.push(status);
    }
    if (startDate) {
        countSql += ' AND DATE(t.created_at) >= ?';
        countParams.push(startDate);
    }
    if (endDate) {
        countSql += ' AND DATE(t.created_at) <= ?';
        countParams.push(endDate);
    }

    const { data, pagination } = await paginateQuery(pool, sql, countSql, params, countParams, page, limit);
    return { data, pagination };
};

module.exports = {
    getRecentTransactions,
    getAllTransactions,
    getTransactionsByUserId
};
