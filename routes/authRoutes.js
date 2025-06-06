const express = require('express');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/user/authController');
const { forgotLimiter } = require('../config/rateLimit');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
