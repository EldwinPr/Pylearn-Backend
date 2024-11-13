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

// Basic CORS setup
app.use(cors({
    origin: 'https://pawm-taupe.vercel.app',
    credentials: true
}));

app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://pawm-taupe.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});

// All routes without middleware
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

module.exports = app;  // Add this for Vercel