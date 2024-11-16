const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

let db;

async function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // First create users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    email TEXT PRIMARY KEY UNIQUE,
                    username TEXT UNIQUE,
                    password TEXT,
                    admin BOOLEAN DEFAULT 0
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    reject(err);
                    return;
                }
                console.log('Users table created successfully');
            });

            // Then create user_progress table
            db.run(`
                CREATE TABLE IF NOT EXISTS user_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT,
                    score INTEGER DEFAULT 0,
                    Drag BOOLEAN DEFAULT 0,
                    Fill BOOLEAN DEFAULT 0,
                    Mult BOOLEAN DEFAULT 0,
                    FOREIGN KEY(user_email) REFERENCES users(email)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating user_progress table:', err);
                    reject(err);
                    return;
                }
                console.log('User_progress table created successfully');
                resolve();
            });
        });
    });
}

async function createTestUser() {
    return new Promise((resolve, reject) => {
        const testUser = {
            email: 'test@admin.com',
            username: 'testadmin',
            password: 'test123',
            admin: true
        };

        bcrypt.hash(testUser.password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                reject(err);
                return;
            }

            db.run(`
                INSERT OR REPLACE INTO users (email, username, password, admin)
                VALUES (?, ?, ?, ?)
            `, [testUser.email, testUser.username, hashedPassword, testUser.admin], 
            function(err) {
                if (err) {
                    console.error('Error creating test user:', err);
                    reject(err);
                    return;
                }
                console.log('Test user created successfully');
                resolve(testUser.email);
            });
        });
    });
}

async function createTestUserProgress(userEmail) {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT OR REPLACE INTO user_progress 
            (user_email, score, Drag, Fill, Mult)
            VALUES (?, 0, 0, 0, 0)
        `, [userEmail], (err) => {
            if (err) {
                console.error('Error creating test user progress:', err);
                reject(err);
                return;
            }
            console.log('Test user progress created successfully');
            resolve();
        });
    });
}

async function initializeDatabase() {
    try {
        // First create all tables
        await createTables();
        
        // Then create test user and progress in production
        if (process.env.NODE_ENV === 'production') {
            const userEmail = await createTestUser();
            await createTestUserProgress(userEmail);
        }
        
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    }
}

if (process.env.NODE_ENV === 'production') {
    db = new sqlite3.Database(':memory:', async (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        console.log('Memory database connected');
        try {
            await initializeDatabase();
        } catch (error) {
            console.error('Fatal error during database initialization:', error);
            process.exit(1);
        }
    });
} else {
    const dbPath = path.resolve(__dirname, 'database.db');
    db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        console.log('File database connected');
        try {
            await initializeDatabase();
        } catch (error) {
            console.error('Fatal error during database initialization:', error);
        }
    });
}

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = db;