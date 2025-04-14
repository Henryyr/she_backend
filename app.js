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
  threshold: 0, // Start compressing immediately
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Cache control middleware
app.use((req, res, next) => {
  // Don't cache API responses in development
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-store');
  } else {
    // Cache successful GET requests in production
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      res.set('Cache-Control', 'no-store');
    }
  }
  next();
});

// Simplified CORS settings
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mysalon.com'] // Ganti dengan domain production Anda
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

// Enhanced Helmet configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch(e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
})); // Limit payload size and validate JSON
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev')); // Simplified logging in development

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

// Stricter rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip + '-' + req.route?.path
  }
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Simplified performance monitoring
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

// Enhanced error handler with security headers
app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 
        'Internal server error' : err.message;
    
    // Remove potentially sensitive error info in production
    if (process.env.NODE_ENV === 'production') {
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
    }
    
    res.status(status).json({ 
        error: message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
