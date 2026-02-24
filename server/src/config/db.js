const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20, // Increased limit
    queueLimit: 0,
    connectTimeout: 20000, // 20 seconds
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true
});

module.exports = pool;
