const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../helpers/uploadHelper'); // gunakan helper baru

const TestimoniController = require('../controllers/user/testimoniController');
const router = express.Router();

router.post('/', authenticate, uploadImage.single('image'), TestimoniController.createTestimoni);
router.get('/public', TestimoniController.getPublicTestimoni);
router.get('/admin', authenticate, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Hanya admin yang bisa melihat semua testimoni" });
    }
    next();
}, TestimoniController.getAllTestimoni);
router.delete('/:id', authenticate, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Hanya admin yang bisa menghapus testimoni" });
    }
    next();
}, TestimoniController.deleteTestimoni);
router.put('/status', authenticate, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Hanya admin yang bisa mengubah status testimoni" });
    }
    next();
}, TestimoniController.updateStatus);

module.exports = router;