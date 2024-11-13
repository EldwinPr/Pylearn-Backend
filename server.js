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

// Updated CORS configuration
app.use(cors({
    origin: ['https://pawm-taupe.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rest of your routes...
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