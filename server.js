const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
    origin: 'https://pawm-taupe.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
    res.sendStatus(200);
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
