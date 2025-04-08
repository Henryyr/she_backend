require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // Import Morgan for logging
const db = require('./db');

const app = express();
const cron = require('node-cron');
const PORT = process.env.PORT || 3000;


app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined')); // Use Morgan for logging

// Rate Limiting Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// 🔹 Jalankan setiap hari pukul 00:00 WIB
cron.schedule('0 0 * * *', async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        await db.promise().query(`DELETE FROM booking WHERE tanggal < ?`, [today]);

        console.log(`✅ [CRON] Booking sebelum ${today} dihapus`);
    } catch (err) {
        console.error("❌ [CRON] Gagal menghapus booking:", err.message);
    }
}, {
    timezone: "Asia/Jakarta" // Sesuaikan timezone
});

// --- ROUTES ---
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/layanan', require('./routes/layananRoutes'));
app.use('/api/layanankategori', require('./routes/layanankategoriRoutes'));
app.use('/api/auth', require('./routes/Auth'));
app.use('/api/transaksi', require('./routes/transaksiRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/testimoni', require('./routes/testimoniRoutes'));

// Error Handling Middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Jalankan server
app.listen(PORT, async () => {
    try {
        await db.connect();
        console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    } catch (error) {
        console.error('Gagal menghubungkan ke database:', error);
    }
});
