const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// Upload options
const uploadOptions = {
    folder: 'testimoni',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' }
    ]
};

// Test connection
cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('Cloudinary connection failed:', error);
    } else {
        console.log('Cloudinary connection successful:', result);
    }
});

module.exports = { cloudinary, uploadOptions };
