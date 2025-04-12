const express = require('express');
const router = express.Router();
const layananKategoriController = require('../controllers/layanankategoriController');

router.get('/', layananKategoriController.getAll.bind(layananKategoriController));
router.get('/:id', layananKategoriController.getById.bind(layananKategoriController));
router.post('/', layananKategoriController.create.bind(layananKategoriController));
router.put('/:id', layananKategoriController.update.bind(layananKategoriController));
router.delete('/:id', layananKategoriController.delete.bind(layananKategoriController));

module.exports = router;
