// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
require('./config/cloudinary');

const app = express();

// Middlewares
app.set('trust proxy', 1);
app.use(compression({
  level: 6,
  threshold: 100,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Enhanced compression logging
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks = [];

    res.write = function (chunk) {
      chunks.push(Buffer.from(chunk));
      oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
      const uncompressedSize = chunks.reduce((total, chunk) => total + chunk.length, 0);
      
      // Log detailed compression info
      console.log('\n=== Compression Info ===');
      console.log(`Path: ${req.path}`);
      console.log(`Content-Type: ${res.get('Content-Type')}`);
      console.log(`Uncompressed size: ${uncompressedSize} bytes`);
      console.log(`Compressed: ${res.get('Content-Encoding') === 'gzip' ? 'Yes' : 'No'}`);
      console.log('=====================\n');
      
      oldEnd.apply(res, arguments);
    };

    return compression.filter(req, res);
  }
}));
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Add security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection

// XSS Protection middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Performance monitoring middleware with more details
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`
                ⚠️ Slow Request Detected
                Method: ${req.method}
                URL: ${req.url}
                Duration: ${duration}ms
                User: ${req.user?.id || 'anonymous'}
                Timestamp: ${new Date().toISOString()}
            `);
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
