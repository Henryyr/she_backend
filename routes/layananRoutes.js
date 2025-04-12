const express = require('express');
const router = express.Router();
const layananController = require('../controllers/layananController');

router.get('/', layananController.getAllLayanan);
router.get('/:id', layananController.getLayananById);
router.post('/', layananController.createLayanan);
router.put('/:id', layananController.updateLayanan);
router.delete('/:id', layananController.deleteLayanan);

module.exports = router;
