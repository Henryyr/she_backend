const { pool } = require('../db');

class UserService {
    async getAllUsers() {
        const [results] = await pool.query('SELECT * FROM users');
        return results;
    }
}

module.exports = new UserService();
