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
            // Determine which score to update based on exercise type
            let scoreField = '';
            let flagField = '';
            
            if (drag) {
                scoreField = 'drag_score';
                flagField = 'Drag';
            } else if (fill) {
                scoreField = 'fill_score';
                flagField = 'Fill';
            } else if (mult) {
                scoreField = 'mult_score';
                flagField = 'Mult';
            }

            // Only update if the new score is higher than the existing score
            const updateSql = `
                UPDATE user_progress 
                SET ${scoreField} = CASE 
                    WHEN ? > ${scoreField} THEN ? 
                    ELSE ${scoreField} 
                END,
                ${flagField} = 1
                WHERE user_email = ?
            `;

            db.run(updateSql, [score, score, user_email], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error updating progress: ' + err.message });
                }
                res.status(200).json({ message: 'Progress updated successfully' });
            });
        } else {
            // Create new progress entry
            const insertSql = `
                INSERT INTO user_progress (
                    user_email, 
                    drag_score, fill_score, mult_score,
                    Drag, Fill, Mult
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const dragScore = drag ? score : 0;
            const fillScore = fill ? score : 0;
            const multScore = mult ? score : 0;

            db.run(insertSql, [
                user_email, 
                dragScore, fillScore, multScore,
                drag || false, fill || false, mult || false
            ], function(err) {
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
                drag_score: 0,
                fill_score: 0,
                mult_score: 0,
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