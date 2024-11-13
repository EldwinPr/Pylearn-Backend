const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const userController = require('./controllers/userController');
const userProgressController = require('./controllers/userProgressController');

// Initialize express app
const app = express();

// Trust proxy settings for Vercel deployment
app.set('trust proxy', 1);

// Security Configurations
const securityConfig = {
  // Helmet configuration for security headers
  helmetOptions: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  },
  
  // Rate limiting configuration
  rateLimitOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS configuration
  corsOptions: {
    origin: function (origin, callback) {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://pawm-taupe.vercel.app')
        .split(',')
        .map(origin => origin.trim().replace(/\/$/, ''));
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // Cache preflight requests for 24 hours
  }
};

// Apply security middleware
app.use(helmet(securityConfig.helmetOptions));
app.use(rateLimit(securityConfig.rateLimitOptions));
app.use(cors(securityConfig.corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
// User management routes
app.post('/register', userController.registerUser);
app.post('/login', userController.loginUser);
app.get('/getUserData', userController.getUserData);
app.post('/updateAccount', userController.updateUserData);
app.get('/getAllUsers', userController.getAllUsers);
app.get('/checkAdminRole', userController.checkAdminRole);
app.delete('/deleteUser', userController.deleteUser);

// Progress tracking routes
app.post('/progress/update', userProgressController.updateProgress);
app.get('/progress', userProgressController.getProgress);
app.post('/progress/reset', userProgressController.resetProgress);
app.get('/progress/completion', userProgressController.getCompletionStatus);

// Error Handling Middleware
// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'Origin not allowed',
      detail: 'The requesting origin is not allowed to access this resource'
    });
  }
  next(err);
});

// Handle validation errors
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      details: err.message
    });
  }
  next(err);
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}\nStack: ${err.stack}`);
  
  // Don't leak error details in production
  const error = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;
  
  res.status(err.status || 500).json({
    status: 'error',
    message: error
  });
});

// 404 handler - Keep this as the last middleware
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Server startup
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;