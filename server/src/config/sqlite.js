const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'physio_cache.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable WAL for better concurrency
db.pragma('journal_mode = WAL');

module.exports = db;
