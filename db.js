const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // Tunggu koneksi jika pool penuh
    connectionLimit: 10, // Batasi jumlah koneksi dalam pool
    queueLimit: 0 // Antrian tidak dibatasi
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log(`✅ Connected to ${process.env.DB_NAME} database`);
    }
});

module.exports = db;
