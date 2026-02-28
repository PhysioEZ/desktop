const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let dbPromise = null;

async function getLocalDb() {
    if (dbPromise) return dbPromise;

    const dbPath = path.join(__dirname, '../../database/local.sqlite');
    const schemaPath = path.join(__dirname, '../../database/schema.sqlite.sql');
    const dbExists = fs.existsSync(dbPath);

    dbPromise = open({
        filename: dbPath,
        driver: sqlite3.Database
    }).then(async (db) => {
        // Check if our main table exists, if not, re-init schema
        const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'");
        if (!tableCheck && fs.existsSync(schemaPath)) {
            console.log("Initializing or repairing SQLite database schema...");
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await db.exec(schema);
            console.log("SQLite schema created successfully.");
        }
        return db;
    });

    return dbPromise;
}

module.exports = { getLocalDb };
