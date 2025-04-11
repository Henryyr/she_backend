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

let db;

const connectWithRetry = () => {
    db = mysql.createConnection(dbConfig);

    db.connect(err => {
        if (err) {
            console.error('❌ Database connection failed:', err);
            console.log('🔄 Retrying connection in 5 seconds...');
            setTimeout(connectWithRetry, 5000); // Coba ulang setelah 5 detik
        } else {
            console.log(`✅ Connected to ${process.env.DB_NAME} database`);
        }
    });
};

connectWithRetry();

module.exports = db;
