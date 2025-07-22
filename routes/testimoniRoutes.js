const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../helpers/uploadHelper');
const TestimoniController = require('../controllers/user/testimoniController');
const router = express.Router();

router.post('/', authenticate, uploadImage.single('image'), TestimoniController.createTestimoni);
router.get('/public', TestimoniController.getPublicTestimoni);

module.exports = router;
