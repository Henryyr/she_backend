const mysql = require('mysql2');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
};

const pool = mysql.createPool(dbConfig).promise();

// Test connection method
const connect = async () => {
    try {
        await pool.query('SELECT 1');
        console.log(`✅ Connected to ${process.env.DB_NAME} database`);
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        throw err;
    }
};

module.exports = {
    pool,
    connect
};
