const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { testEmailController } = require('../controllers/user/testController');

// Endpoint: GET /api/test/email
router.get('/', authenticate, testEmailController);

module.exports = router;
