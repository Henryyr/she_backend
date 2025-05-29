const express = require('express');
const router = express.Router();
const layananController = require('../controllers/user/layananController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate,  layananController.getAllLayanan);
router.get('/:id', authenticate, layananController.getLayananById);

module.exports = router;
