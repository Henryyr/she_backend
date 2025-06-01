const TestimoniService = require('../../services/user/testimoniService');
const { cloudinary, uploadOptions } = require('../../config/cloudinary');
const { pool } = require('../../db');

const createTestimoni = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        let { layanan_id, rating, comment } = req.body;
        let image_url = null;

        // Parse layanan_id as array if not already
        if (typeof layanan_id === 'string') {
            layanan_id = layanan_id.split(',').map(id => id.trim());
        }
        if (!Array.isArray(layanan_id)) {
            layanan_id = [layanan_id];
        }

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
        await connection.beginTransaction();

        // Insert ke testimoni (satu baris)
        const testimoni = await TestimoniService.createTestimoniWithConn(connection, { 
            user_id,
            rating, 
            comment,
            image_url
        });

        // Insert ke testimoni_layanan (banyak baris)
        const testimoni_id = testimoni.insertId;
        const values = layanan_id.map(id => [testimoni_id, Number(id)]);
        await connection.query(
            'INSERT INTO testimoni_layanan (testimoni_id, layanan_id) VALUES ?',
            [values]
        );

        await connection.commit();

        res.json({ 
            message: "Testimoni berhasil ditambahkan dan menunggu approval", 
            data: {
                id: testimoni_id,
                layanan_id: layanan_id.map(Number),
                image_url
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error in createTestimoni:', err);
        if (err.http_code) {
            console.error('Cloudinary error details:', {
                http_code: err.http_code,
                message: err.message
            });
        }
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

const getPublicTestimoni = async (req, res) => {
    try {
        // Ambil semua testimoni yang approved
        const testimonials = await TestimoniService.getPublic();

        // Ambil semua testimoni_id
        const testimoniIds = testimonials.map(t => t.id);
        if (testimoniIds.length === 0) {
            return res.json([]);
        }

        // Ambil semua relasi testimoni_layanan
        const [relations] = await pool.query(
            `SELECT tl.testimoni_id, tl.layanan_id, l.nama as layanan_nama
             FROM testimoni_layanan tl
             JOIN layanan l ON tl.layanan_id = l.id
             WHERE tl.testimoni_id IN (${testimoniIds.map(() => '?').join(',')})`,
            testimoniIds
        );

        // Ambil username untuk semua user_id unik
        const userIds = [...new Set(testimonials.map(t => t.user_id))];
        const [users] = await pool.query(
            `SELECT id, username FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
            userIds
        );
        const userMap = {};
        users.forEach(u => { userMap[u.id] = u.username; });

        // Mapping testimoni_id ke array layanan
        const layananMap = {};
        relations.forEach(r => {
            if (!layananMap[r.testimoni_id]) layananMap[r.testimoni_id] = [];
            layananMap[r.testimoni_id].push({ id: r.layanan_id, nama: r.layanan_nama });
        });

        // Gabungkan ke setiap testimoni + username
        testimonials.forEach(t => {
            t.layanans = layananMap[t.id] || [];
            t.username = userMap[t.user_id] || null;
        });

        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createTestimoni,
    getPublicTestimoni
};