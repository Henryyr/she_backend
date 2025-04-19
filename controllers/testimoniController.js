const TestimoniService = require('../services/testimoniService');
const { cloudinary, uploadOptions } = require('../config/cloudinary');

class TestimoniController {
    static async createTestimoni(req, res) {
        try {
            const { rating, comment } = req.body;
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
            const testimoni = await TestimoniService.create({ 
                user_id,
                rating, 
                comment,
                image_url 
            });
            
            res.json({ 
                message: "Testimoni berhasil ditambahkan dan menunggu approval", 
                id: testimoni.insertId 
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
    }

    static async getPublicTestimoni(req, res) {
        try {
            const testimonials = await TestimoniService.getPublic();
            res.json(testimonials);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getAllTestimoni(req, res) {
        try {
            const testimonials = await TestimoniService.getAll();
            res.json(testimonials);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async deleteTestimoni(req, res) {
        try {
            const { id } = req.params;
            await TestimoniService.delete(id);
            res.json({ message: "Testimoni berhasil dihapus" });
        } catch (err) {
            if (err.message === 'Not Found') {
                return res.status(404).json({ error: "Testimoni tidak ditemukan" });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async approveTestimoni(req, res) {
        try {
            const { id } = req.params;
            const { is_public } = req.body;
            await TestimoniService.approve(id, is_public);
            res.json({ message: "Testimoni berhasil diapprove" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async updateStatus(req, res) {
        try {
            const { testimoni_id, status } = req.body;
            
            if (!testimoni_id || !status) {
                return res.status(400).json({ 
                    error: "testimoni_id dan status wajib diisi" 
                });
            }

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({ 
                    error: "Status hanya bisa 'approved' atau 'rejected'" 
                });
            }

            await TestimoniService.updateStatus(testimoni_id, status);
            
            res.json({ 
                message: `Testimoni berhasil di-${status}` 
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = TestimoniController;
