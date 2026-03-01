require('dotenv').config();
const mysql = require('mysql2/promise');

let mysqlPool = null;

function getMysqlPool() {
    if (!mysqlPool) {
        mysqlPool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'prospine',
            password: process.env.DB_PASS || '1234',
            database: process.env.DB_NAME || 'prospine',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true
        });
    }
    return mysqlPool;
}

const pool = {
    async query(sql, params) {
        const p = getMysqlPool();
        return await p.query(sql, params);
    },
    async execute(sql, params) {
        const p = getMysqlPool();
        return await p.execute(sql, params);
    },
    async getConnection() {
        const p = getMysqlPool();
        return await p.getConnection();
    },
    async queryRemote(sql, params) {
        return await this.query(sql, params);
    },
    queryContext: {
        run: (context, next) => next()
    }
};

module.exports = pool;
