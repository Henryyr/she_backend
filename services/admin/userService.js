const { pool } = require('../../db');
const paginateQuery = require('../../helpers/paginateQuery');

const getAllUsers = async (page = 1, limit = 10) => {
    const sql = `
        SELECT id, fullname, email, phone_number, username, address, role 
        FROM users
        ORDER BY created_at DESC
    `;
    const countSql = `SELECT COUNT(*) as total FROM users`;

    const { data, pagination } = await paginateQuery(pool, sql, countSql, [], [], page, limit);
    return { users: data, pagination };
};

const getUserById = async (id) => {
    const sql = "SELECT id, fullname, email, phone_number, username, address, role FROM users WHERE id = ?";
    const [user] = await pool.query(sql, [id]);
    if (user.length === 0) {
        return null;
    }
    return user[0];
};

const updateUser = async (id, data) => {
    const { fullname, email, phone_number, username, address, role } = data;
    const sql = "UPDATE users SET fullname = ?, email = ?, phone_number = ?, username = ?, address = ?, role = ? WHERE id = ?";
    const [result] = await pool.query(sql, [fullname, email, phone_number, username, address, role, id]);
    return result.affectedRows > 0;
};

const deleteUser = async (id) => {
    const sql = "DELETE FROM users WHERE id = ?";
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};