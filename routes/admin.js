const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', authenticate, isAdmin, adminController.getDashboard);
router.post('/users', authenticate, isAdmin, adminController.createUser);
router.put('/users/:id', authenticate, isAdmin, adminController.updateUser);
router.delete('/users/:id', authenticate, isAdmin, adminController.deleteUser);

module.exports = router;
