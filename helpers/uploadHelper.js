const multer = require('multer');
const path = require('path');

function checkFileType(file, cb) {
    const allowedTypes = ['jpeg', 'jpg', 'png'];

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.split('/')[1];

    const isExtAllowed = allowedTypes.includes(ext);
    const isMimeAllowed = allowedTypes.includes(mime);

    if (isExtAllowed && isMimeAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Error: Only JPEG, JPG, and PNG images are allowed!'));
    }
}

const uploadImage = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = {
    uploadImage
};
