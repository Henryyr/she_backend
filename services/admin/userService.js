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
    const fields = [];
    const values = [];

    // Daftar field yang diizinkan untuk diubah
    const allowedFields = ['fullname', 'email', 'phone_number', 'username', 'address', 'role'];

    // Loop melalui data yang dikirim dan buat query secara dinamis
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && allowedFields.includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    // Jika tidak ada field valid yang dikirim, tidak ada yang perlu diupdate
    if (fields.length === 0) {
        return true; 
    }
    
    // Tambahkan ID ke akhir array values untuk klausa WHERE
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    try {
        const [result] = await pool.query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("SQL Error in updateUser:", error);
        throw error;
    }
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