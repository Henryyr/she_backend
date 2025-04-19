const express = require('express');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Ganti storage ke memory untuk sementara sebelum upload ke Cloudinary
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const TestimoniController = require('../controllers/testimoniController');
const router = express.Router();

router.post('/', authenticate, upload.single('image'), TestimoniController.createTestimoni);
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