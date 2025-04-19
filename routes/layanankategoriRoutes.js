const express = require('express');
const router = express.Router();
const layananKategoriController = require('../controllers/layanankategoriController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate,  layananKategoriController.getAll.bind(layananKategoriController));
router.get('/:id', authenticate, layananKategoriController.getById.bind(layananKategoriController));
router.post('/', authenticate, layananKategoriController.create.bind(layananKategoriController));
router.put('/:id', authenticate, layananKategoriController.update.bind(layananKategoriController));
router.delete('/:id', authenticate, layananKategoriController.delete.bind(layananKategoriController));

module.exports = router;
