const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const userController = require('./controllers/userController');
const userProgressController = require('./controllers/userProgressController');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'https://pawm-taupe.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// User routes
app.post('/register', userController.registerUser);
app.post('/login', userController.loginUser);
app.get('/getUserData', userController.getUserData);
app.post('/updateAccount', userController.updateUserData);
app.get('/getAllUsers', userController.getAllUsers);
app.get('/checkAdminRole', userController.checkAdminRole);
app.delete('/deleteUser', userController.deleteUser);

// Progress routes
app.post('/progress/update', userProgressController.updateProgress);
app.get('/progress', userProgressController.getProgress);
app.post('/progress/reset', userProgressController.resetProgress);
app.get('/progress/completion', userProgressController.getCompletionStatus);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;