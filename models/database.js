const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

let db;

if (process.env.NODE_ENV === 'production') {
    db = new sqlite3.Database(':memory:', (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        initializeDatabase();
    });
} else {
    const dbPath = path.resolve(__dirname, 'database.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        initializeDatabase();
    });
}

function initializeDatabase() {
    db.serialize(() => {
        // Create tables
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY UNIQUE,
                username TEXT UNIQUE,
                password TEXT,
                admin BOOLEAN DEFAULT 0
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT,
                score INTEGER DEFAULT 0,
                Drag BOOL DEFAULT 0,
                Fill BOOL DEFAULT 0,
                Mult BOOL DEFAULT 0,
                FOREIGN KEY(user_email) REFERENCES users(email)
            )
        `);

        // In production, create a test account
        if (process.env.NODE_ENV === 'production') {
            // Create a test admin account
            const testUser = {
                email: 'test@admin.com',
                username: 'testadmin',
                password: 'test123',
                admin: true
            };

            bcrypt.hash(testUser.password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return;
                }

                db.run(`
                    INSERT OR REPLACE INTO users (email, username, password, admin)
                    VALUES (?, ?, ?, ?)
                `, [testUser.email, testUser.username, hashedPassword, testUser.admin], 
                function(err) {
                    if (err) {
                        console.error('Error creating test user:', err);
                    } else {
                        console.log('Test user created successfully');
                        // Create initial progress for test user
                        db.run(`
                            INSERT OR REPLACE INTO user_progress 
                            (user_email, score, Drag, Fill, Mult)
                            VALUES (?, 0, 0, 0, 0)
                        `, [testUser.email]);
                    }
                });
            });
        }
    });
}

module.exports = db;