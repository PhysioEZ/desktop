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
        if (!dbExists && fs.existsSync(schemaPath)) {
            console.log("Initializing SQLite database from schema...");
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await db.exec(schema);
            console.log("SQLite schema created successfully.");
        }
        return db;
    });

    return dbPromise;
}

module.exports = { getLocalDb };
