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
        
        const result = await db.query(
            'INSERT INTO users (email, username, password, admin) VALUES ($1, $2, $3, $4) RETURNING email',
            [email, username, hashedPassword, true]
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

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Error during login: ' + err.message });
    }
};

// Update user data
const updateUserData = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    const userEmail = req.query.email;

    if (!username || !currentPassword) {
        return res.status(400).json({ message: 'Username and current password are required' });
    }

    try {
        // Fetch current user
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [userEmail]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        if (newPassword) {
            // Update username and password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await db.query(
                'UPDATE users SET username = $1, password = $2 WHERE email = $3',
                [username, hashedNewPassword, userEmail]
            );
        } else {
            // Update only username
            await db.query(
                'UPDATE users SET username = $1 WHERE email = $2',
                [username, userEmail]
            );
        }

        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user: ' + err.message });
    }
};

// Get user data
const getUserData = async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
                Drag: row.drag === true,
                Fill: row.fill === true,
                Mult: row.mult === true,
                score: row.score || 0
            }
        }));

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // PostgreSQL will handle cascade delete if set up properly
        const result = await db.query(
            'DELETE FROM users WHERE email = $1 RETURNING *',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user: ' + error.message });
    }
};

// Check Admin Role
const checkAdminRole = async (req, res) => {
    const userEmail = req.query.email;
    
    if (!userEmail) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const result = await db.query(
            'SELECT admin FROM users WHERE email = $1',
            [userEmail]
        );

        if (result.rows.length === 0) {
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
    getUserData,
    updateUserData,
    getAllUsers,
    checkAdminRole,
    deleteUser
};