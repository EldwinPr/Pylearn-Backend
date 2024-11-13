// Import dependencies
const db = require('../models/database');

// Create or update user progress
const updateProgress = async (req, res) => {
    const { user_email, score, drag, fill, mult } = req.body;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        // Check if user progress exists
        const checkResult = await db.query(
            'SELECT * FROM user_progress WHERE user_email = $1',
            [user_email]
        );

        if (checkResult.rows.length > 0) {
            // Update existing progress using COALESCE to keep existing values if new ones aren't provided
            const updateResult = await db.query(`
                UPDATE user_progress 
                SET score = COALESCE($1, score),
                    Drag = COALESCE($2, Drag),
                    Fill = COALESCE($3, Fill),
                    Mult = COALESCE($4, Mult)
                WHERE user_email = $5
                RETURNING *
            `, [score, drag, fill, mult, user_email]);

            res.status(200).json({ message: 'Progress updated successfully' });
        } else {
            // Create new progress entry
            const insertResult = await db.query(`
                INSERT INTO user_progress (user_email, score, Drag, Fill, Mult)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [user_email, score || 0, drag || false, fill || false, mult || false]);

            res.status(201).json({ message: 'Progress created successfully' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error updating progress: ' + err.message });
    }
};

// Get user progress
const getProgress = async (req, res) => {
    const user_email = req.query.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM user_progress WHERE user_email = $1',
            [user_email]
        );

        if (result.rows.length === 0) {
            // If no progress found, return default values
            return res.status(200).json({
                user_email,
                score: 0,
                Drag: false,
                Fill: false,
                Mult: false
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching progress: ' + err.message });
    }
};

// Reset user progress
const resetProgress = async (req, res) => {
    const user_email = req.body.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const result = await db.query(`
            UPDATE user_progress 
            SET score = 0, Drag = false, Fill = false, Mult = false 
            WHERE user_email = $1
            RETURNING *
        `, [user_email]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No progress found for this user' });
        }

        res.status(200).json({ message: 'Progress reset successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting progress: ' + err.message });
    }
};

// Get completion status
const getCompletionStatus = async (req, res) => {
    const user_email = req.query.email;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const result = await db.query(
            'SELECT Drag, Fill, Mult FROM user_progress WHERE user_email = $1',
            [user_email]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                Drag: false,
                Fill: false,
                Mult: false,
                totalCompleted: 0
            });
        }

        const row = result.rows[0];
        const totalCompleted = [row.drag, row.fill, row.mult].filter(Boolean).length;

        res.status(200).json({
            ...row,
            totalCompleted
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching completion status: ' + err.message });
    }
};

module.exports = {
    updateProgress,
    getProgress,
    resetProgress,
    getCompletionStatus
};