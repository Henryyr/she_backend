const express = require('express');
const router = express.Router();
const layananKategoriController = require('../controllers/user/layanankategoriController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate,  layananKategoriController.getAll.bind(layananKategoriController));
router.get('/:id', authenticate, layananKategoriController.getById.bind(layananKategoriController));

module.exports = router;
