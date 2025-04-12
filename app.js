// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
require('./config/cloudinary');

const app = express();

// Middlewares
app.set('trust proxy', 1);
app.use(compression());
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Performance monitoring middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
        }
    });
    next();
});

// ROUTES
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/layanan', require('./routes/layananRoutes'));
app.use('/api/layanankategori', require('./routes/layanankategoriRoutes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transaksi', require('./routes/transaksiRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/testimoni', require('./routes/testimoniRoutes'));
app.use('/api/transaksikategori', require('./routes/transaksikategoriRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

// Error handler
app.use((err, _req, res, _next) => {
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
    });
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

module.exports = app;
