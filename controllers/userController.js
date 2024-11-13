const db = require('../models/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert the user
        const result = await db.query(
            'INSERT INTO users (email, username, password, admin) VALUES ($1, $2, $3, $4) RETURNING email',
            [email, username, hashedPassword, false]
        );

        res.status(201).json({ message: 'User registered successfully', userEmail: result.rows[0].email });
    } catch (err) {
        if (err.code === '23505') { // Unique violation in PostgreSQL
            return res.status(400).json({ message: 'Email or username already exists' });
        }
        res.status(500).json({ message: 'Error creating user: ' + err.message });
    }
};

// Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Error during login: ' + err.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT users.*, 
                   user_progress.Drag, 
                   user_progress.Fill, 
                   user_progress.Mult,
                   user_progress.score
            FROM users 
            LEFT JOIN user_progress ON users.email = user_progress.user_email
        `);

        const users = result.rows.map(row => ({
            username: row.username,
            email: row.email,
            role: row.admin ? 'admin' : 'user',
            progress: {
                Drag: row.drag || false,
                Fill: row.fill || false,
                Mult: row.mult || false,
                score: row.score || 0
            }
        }));

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await db.query('DELETE FROM users WHERE email = $1 RETURNING *', [email]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user: ' + err.message });
    }
};

// Check Admin Role
const checkAdminRole = async (req, res) => {
    const userEmail = req.query.email;
    
    if (!userEmail) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await db.query('SELECT admin FROM users WHERE email = $1', [userEmail]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!result.rows[0].admin) {
            return res.status(403).json({ message: 'Not an admin user' });
        }

        res.status(200).json({ message: 'Admin role verified', isAdmin: true });
    } catch (err) {
        res.status(500).json({ message: 'Error checking admin role: ' + err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    checkAdminRole,
    deleteUser
};