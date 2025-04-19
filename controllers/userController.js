const userService = require('../services/userService');

class UserController {
    async getAllUsers(req, res) {
        try {
            console.log('Getting all users...');
            const users = await userService.getAllUsers();
            console.log('Users retrieved:', users.length);
            res.json(users);
        } catch (err) {
            console.error('Error getting users:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new UserController();
