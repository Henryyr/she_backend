require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Untuk parsing JSON
app.use(bodyParser.urlencoded({ extended: true }));

// --- ROUTES ---
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/layanan', require('./routes/layananRoutes'));
app.use('/api/layanankategori', require('./routes/layanankategoriRoutes'));
app.use('/api/auth', require('./routes/Auth'));
app.use('/api/transaksi', require('./routes/transaksiRoutes'));
app.use('/api/admin', require('./routes/admin'));

// Jalankan server
app.listen(PORT, async () => {
    try {
        await db.connect();
        console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    } catch (error) {
        console.error('Gagal menghubungkan ke database:', error);
    }
});
