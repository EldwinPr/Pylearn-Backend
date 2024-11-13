const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false // Required for some hosting providers
    }
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Initialize database tables
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                admin BOOLEAN DEFAULT FALSE
            );
        `);

        // Create user progress table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
                score INTEGER DEFAULT 0,
                Drag BOOLEAN DEFAULT FALSE,
                Fill BOOLEAN DEFAULT FALSE,
                Mult BOOLEAN DEFAULT FALSE
            );
        `);

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
    }
}

// Initialize tables
initializeDatabase();

module.exports = {
    query: (text, params) => pool.query(text, params)
};