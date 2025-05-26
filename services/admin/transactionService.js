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

const getAllTransactions = async (page = 1, limit = 10) => {
    const sql = `
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
        GROUP BY t.id
        ORDER BY t.created_at DESC
    `;
    const countSql = `SELECT COUNT(DISTINCT t.id) as total FROM transaksi t`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [], [], page, limit);
    return { transactions: data, pagination };
};

const getTransactionsByUserId = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
        db.transaction.findMany({
            where: { userId },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        db.transaction.count({ where: { userId } })
    ]);

    const totalPages = Math.ceil(countResult / limit);

    return {
        data: rows,
        pagination: {
            totalItems: countResult,
            totalPages,
            currentPage: page,
            perPage: limit
        }
    };
};

module.exports = {
    getRecentTransactions,
    getAllTransactions,
    getTransactionsByUserId
};
