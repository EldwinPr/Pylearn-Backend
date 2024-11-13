const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

if (process.env.NODE_ENV === 'production') {
    // Use in-memory database for Vercel
    db = new sqlite3.Database(':memory:', (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        initializeDatabase();
    });
} else {
    // Use file database for development
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
        // Create users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY UNIQUE,
                username TEXT UNIQUE,
                password TEXT,
                admin BOOLEAN DEFAULT 0
            )
        `);

        // Create user progress table
        db.run(`
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
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        process.exit(0);
    });
});

module.exports = db;