const TestimoniService = require('../../services/user/testimoniService');
const { cloudinary, uploadOptions } = require('../../config/cloudinary');

const createTestimoni = async (req, res) => {
    try {
        const { layanan_id, rating, comment } = req.body;
        let image_url = null;

        if (req.file) {
            console.log('Uploading image to Cloudinary...');
            console.log('File details:', {
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            });

            // Convert buffer to Base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            
            // Upload ke Cloudinary dengan optimisasi
            const result = await cloudinary.uploader.upload(dataURI, {
                ...uploadOptions,
                public_id: `TESTI-${Date.now()}`
            });
            
            console.log('Cloudinary upload success:', {
                public_id: result.public_id,
                url: result.secure_url,
                size: result.bytes,
                format: result.format
            });
            
            image_url = result.secure_url;
        }
        
        const user_id = req.user.id;
        const testimoni = await TestimoniService.createTestimoni({ 
            user_id,
            layanan_id,
            rating, 
            comment,
            image_url
        });
        
        res.json({ 
            message: "Testimoni berhasil ditambahkan dan menunggu approval", 
            id: testimoni.insertId,
            image_url // tambahkan ini agar url gambar muncul di response
        });
    } catch (err) {
        console.error('Error in createTestimoni:', err);
        if (err.http_code) {
            console.error('Cloudinary error details:', {
                http_code: err.http_code,
                message: err.message
            });
        }
        res.status(500).json({ error: err.message });
    }
};

const getPublicTestimoni = async (req, res) => {
    try {
        const testimonials = await TestimoniService.getPublic();
        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createTestimoni,
    getPublicTestimoni
};
