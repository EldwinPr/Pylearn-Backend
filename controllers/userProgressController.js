// Import dependencies
const db = require('../models/database');

// Create or update user progress
const updateProgress = (req, res) => {
    const { user_email, score, drag, fill, mult } = req.body;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    // Check if user progress exists
    const checkSql = `SELECT * FROM user_progress WHERE user_email = ?`;
    db.get(checkSql, [user_email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking user progress: ' + err.message });
        }

        if (row) {
            // Update existing progress
            const updateSql = `
                UPDATE user_progress 
                SET score = COALESCE(?, score),
                    Drag = COALESCE(?, Drag),
                    Fill = COALESCE(?, Fill),
                    Mult = COALESCE(?, Mult)
                WHERE user_email = ?
            `;

            db.run(updateSql, [score, drag, fill, mult, user_email], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error updating progress: ' + err.message });
                }
                res.status(200).json({ message: 'Progress updated successfully' });
            });
        } else {
            // Create new progress entry
            const insertSql = `
                INSERT INTO user_progress (user_email, score, Drag, Fill, Mult)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.run(insertSql, [user_email, score || 0, drag || false, fill || false, mult || false], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error creating progress: ' + err.message });
                }
                res.status(201).json({ message: 'Progress created successfully' });
            });
        }
    });
};

// Get user progress
const getProgress = (req, res) => {
    const user_email = req.query.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    const sql = `SELECT * FROM user_progress WHERE user_email = ?`;
    
    db.get(sql, [user_email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching progress: ' + err.message });
        }

        if (!row) {
            // If no progress found, return default values
            return res.status(200).json({
                user_email,
                score: 0,
                Drag: false,
                Fill: false,
                Mult: false
            });
        }

        res.status(200).json(row);
    });
};

// Reset user progress
const resetProgress = (req, res) => {
    const user_email = req.body.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    const sql = `
        UPDATE user_progress 
        SET score = 0, Drag = false, Fill = false, Mult = false 
        WHERE user_email = ?
    `;

    db.run(sql, [user_email], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error resetting progress: ' + err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'No progress found for this user' });
        }

        res.status(200).json({ message: 'Progress reset successfully' });
    });
};

// Get completion status
const getCompletionStatus = (req, res) => {
    const user_email = req.query.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    const sql = `SELECT Drag, Fill, Mult FROM user_progress WHERE user_email = ?`;
    
    db.get(sql, [user_email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching completion status: ' + err.message });
        }

        if (!row) {
            return res.status(200).json({
                Drag: false,
                Fill: false,
                Mult: false,
                totalCompleted: 0
            });
        }

        const totalCompleted = [row.Drag, row.Fill, row.Mult].filter(Boolean).length;

        res.status(200).json({
            ...row,
            totalCompleted
        });
    });
};

module.exports = {
    updateProgress,
    getProgress,
    resetProgress,
    getCompletionStatus
};