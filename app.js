// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const responseTime = require('response-time');
const errorHandler = require('./middleware/errorHandler');
require('./config/cloudinary');

const app = express();

// Middlewares
app.set('trust proxy', 1);

// Cache control middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-store');
  } else {
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300');
    } else {
      res.set('Cache-Control', 'no-store');
    }
  }
  next();
});

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://shesalon.store']
  : (process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000']);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

// Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Validasi dan parsing JSON
app.use(express.json({
  limit: '10kb'
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(morgan('dev'));

// XSS protection
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
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
  max: process.env.NODE_ENV === 'production' ? 50 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip + '-' + req.route?.path
});
app.use('/api/', limiter);

// Response time middleware
app.use(responseTime());

// Performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow Request - ${req.method} ${req.url}: ${duration}ms`);
    }
  });
  next();
});

// Routes
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/layanan', require('./routes/layananRoutes'));
app.use('/api/layanankategori', require('./routes/layanankategoriRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transaksi', require('./routes/transaksiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/testimoni', require('./routes/testimoniRoutes'));
app.use('/api/transaksikategori', require('./routes/transaksikategoriRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/email', require('./routes/testRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));

// Global error handler
app.use(errorHandler);

module.exports = app;
