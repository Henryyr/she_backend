const db = require('../db');

class UserService {
    async getAllUsers() {
        const [results] = await db.promise().query('SELECT * FROM users');
        return results;
    }
}

module.exports = new UserService();
