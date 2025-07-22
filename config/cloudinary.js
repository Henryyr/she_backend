const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
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
    { width: 1000, crop: 'scale' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
};

// Initialize Cloudinary connection
const initCloudinary = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Connected to Cloudinary');
  } catch (error) {
    console.log('⚠️ Cloudinary connection not available');
  }
};

// Call initialization without waiting
initCloudinary().catch(() => {});

module.exports = { cloudinary, uploadOptions };
