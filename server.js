const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route handlers
const { 
  registerUser, 
  loginUser, 
  getUserData, 
  updateUserData, 
  getAllUsers, 
  checkAdminRole, 
  deleteUser 
} = require('./userController');

const { 
  updateProgress, 
  getProgress, 
  resetProgress, 
  getCompletionStatus 
} = require('./progressController');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'https://pawm-taupe.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Define routes
app.post('/register', registerUser);
app.post('/login', loginUser);
app.get('/getUserData', getUserData);
app.post('/updateAccount', updateUserData);
app.get('/getAllUsers', getAllUsers);
app.get('/checkAdminRole', checkAdminRole);
app.delete('/deleteUser', deleteUser);

// Progress routes
app.post('/progress/update', updateProgress);
app.get('/progress', getProgress);
app.post('/progress/reset', resetProgress);
app.get('/progress/completion', getCompletionStatus);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;