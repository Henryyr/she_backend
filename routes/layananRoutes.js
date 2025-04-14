const express = require('express');
const router = express.Router();
const layananController = require('../controllers/layananController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate,  layananController.getAllLayanan);
router.get('/:id', authenticate, layananController.getLayananById);
router.post('/', authenticate, layananController.createLayanan);
router.put('/:id', authenticate, layananController.updateLayanan);
router.delete('/:id', authenticate, layananController.deleteLayanan);

module.exports = router;
