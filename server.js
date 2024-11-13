const express = require('express');
const cors = require('cors');
const { 
    registerUser, 
    loginUser, 
    getUserData, 
    updateUserData, 
    getAllUsers, 
    checkAdminRole, 
    deleteUser 
} = require('./controllers/userController');
const { 
    updateProgress, 
    getProgress, 
    resetProgress, 
    getCompletionStatus 
} = require('./controllers/userProgressController');

const app = express();

// Basic CORS setup with detailed configuration
app.use(cors({
    origin: 'https://pawm-taupe.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// No need to manually set headers for preflight; CORS middleware will handle it
app.options('*', cors());

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
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;  // Required for Vercel
