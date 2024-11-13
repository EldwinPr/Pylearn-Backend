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

// Enhanced CORS configuration for production
const allowedOrigins = [
    'https://github.com/EldwinPr/Pylearn-Backend.git', // Replace with your actual GitHub Pages URL
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Body parser middleware
app.use(express.json());

// Basic security middlewares
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
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
    console.error(`${new Date().toISOString()} - Error:`, err);
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Updated listener for production
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});