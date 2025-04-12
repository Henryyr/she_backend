const { pool } = require('../db');

const getAllUsers = async () => {
    const [results] = await pool.query(
        "SELECT id, fullname, email, phone_number, username, address, role FROM users"
    );
    return results;
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
    updateUser,
    deleteUser
};
