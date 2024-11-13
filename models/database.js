const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Database connected');

        // Utility function to create tables
        const createTable = (sql) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error('Error creating table ' + err.message);
                }
            });
        };

        // Create users table
        createTable(`
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY UNIQUE,
                username TEXT UNIQUE,
                password TEXT,
                admin BOOLEAN DEFAULT 0
            )
        `);

        // Create user progress table
        createTable(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT,
                score INTEGER,
                Drag BOOL,
                Fill BOOL,
                Mult BOOL,
                FOREIGN KEY(user_email) REFERENCES users(email)
            )
        `);
    }
});

// Handle graceful database closure
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Export the database object
module.exports = db;
