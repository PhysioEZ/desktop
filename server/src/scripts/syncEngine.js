const { getLocalDb } = require('../config/sqlite');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const lastSyncMapFile = path.join(__dirname, '../../database/sync_status.json');

const SYNCABLE_TABLES = {
    'patients': 'updated_at',
    'registration': 'updated_at',
    'tests': 'updated_at',
    'attendance': 'created_at',
    'payments': 'created_at',
    'quick_inquiry': 'created_at',
    'test_inquiry': 'created_at',
    'patient_master': 'first_registered_at',
    'employees': 'updated_at',
    'patients_treatment': 'created_at',
    'notifications': 'created_at',
    'expenses': 'created_at',
    'reception_notes': 'created_at',
    'referral_partners': 'partner_id',
    'roles': 'role_id',
    'branches': 'branch_id',
    'system_settings': 'updated_at',
    'users': 'id',
    'test_items': 'created_at',
    'test_payments': 'created_at',
    'test_types': 'test_type_id',
    'payment_methods': 'method_id',
    'system_issues': 'created_at',
    'system_services': 'last_updated',
    'patient_feedback': 'created_at',
    'service_tracks': 'created_at'
};

function getLastSyncMap() {
    if (fs.existsSync(lastSyncMapFile)) {
        try {
            return JSON.parse(fs.readFileSync(lastSyncMapFile, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function setLastSyncMap(map) {
    fs.mkdirSync(path.dirname(lastSyncMapFile), { recursive: true });
    fs.writeFileSync(lastSyncMapFile, JSON.stringify(map, null, 2));
}

let syncMap = getLastSyncMap();
let isPulling = false;
let isPushing = false;

/**
 * TASK: PULL (Fetch from Source -> Local SQLite)
 * Runs every 20 seconds at T+0s
 */
async function runPull() {
    if (isPulling) return;
    isPulling = true;
    console.log(`[Sync Engine] Cycle: PULL at ${new Date().toLocaleTimeString()}`);

    try {
        const startOfTime = '2000-01-01 00:00:00';
        let overallSince = syncMap.global || startOfTime;
        let changes = {};

        // 1. Fetch updates from source for all tables
        for (const [table, tsCol] of Object.entries(SYNCABLE_TABLES)) {
            let sql = `SELECT * FROM ${table}`;
            let params = [];

            if (tsCol === 'updated_at' || tsCol === 'created_at' || tsCol === 'first_registered_at') {
                sql += ` WHERE ${tsCol} > ? ORDER BY ${tsCol} ASC LIMIT 2000`;
                params = [overallSince];
            }

            try {
                // pool.queryRemote forces hits to Source (MySQL or Bridge)
                const [rows] = await pool.queryRemote(sql, params);
                if (rows && rows.length > 0) {
                    changes[table] = rows;
                }
            } catch (err) {
                console.error(`[Sync Pull] Fetch fail table ${table}:`, err.message);
            }
        }

        // 2. Merge into local SQLite
        if (Object.keys(changes).length > 0) {
            const db = await getLocalDb();
            await db.run('BEGIN TRANSACTION');

            try {
                let latestFound = overallSince;
                for (const [table, rows] of Object.entries(changes)) {
                    // Get SQLite schema for this table to filter columns
                    let tableColumns, primaryKeys = [];
                    try {
                        const pragma = await db.all(`PRAGMA table_info("${table}")`);
                        tableColumns = new Map(pragma.map(c => [c.name.toLowerCase(), c.name]));
                        primaryKeys = pragma.filter(c => c.pk > 0).map(c => c.name.toLowerCase());
                    } catch (e) {
                        console.warn(`[Sync Pull] Schema error for ${table}:`, e.message);
                        continue;
                    }

                    for (const row of rows) {
                        // Filter to only columns that exist in SQLite
                        const cols = [];
                        const vals = [];
                        Object.keys(row).forEach(resCol => {
                            const lower = resCol.toLowerCase();
                            if (tableColumns.has(lower)) {
                                cols.push(tableColumns.get(lower));
                                vals.push(row[resCol]);
                            }
                        });

                        if (cols.length === 0) continue;

                        // Only mirror if we have all primary keys
                        const resultColsLower = cols.map(c => c.toLowerCase());
                        if (primaryKeys.length > 0 && !primaryKeys.every(pk => resultColsLower.includes(pk))) {
                            continue;
                        }

                        const placeholders = cols.map(() => '?').join(', ');
                        const colNames = cols.map(c => `"${c}"`).join(', ');
                        await db.run(`REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders})`, vals);

                        const tsCol = SYNCABLE_TABLES[table];
                        if (row[tsCol] && row[tsCol] > latestFound) {
                            latestFound = row[tsCol];
                        }
                    }
                }
                await db.run('COMMIT');

                if (latestFound > overallSince) {
                    syncMap.global = latestFound;
                    setLastSyncMap(syncMap);
                    console.log(`[Sync Engine] PULL Complete. Local SQLite updated to -> ${latestFound}`);
                }
            } catch (err) {
                await db.run('ROLLBACK');
                console.error("[Sync Engine] PULL Merge Error:", err);
            }
        }
    } catch (err) {
        console.error("[Sync Engine] Global PULL Error:", err);
    } finally {
        isPulling = false;
    }
}

/**
 * TASK: PUSH (Locally Queued Changes -> Source MySQL/Bridge)
 * Runs every 20 seconds at T+10s
 */
async function runPush() {
    if (isPushing) return;
    isPushing = true;
    console.log(`[Sync Engine] Cycle: PUSH at ${new Date().toLocaleTimeString()}`);

    const startTime = Date.now();
    const MAX_PUSH_TIME = 10000; // 10 seconds limit per cycle

    try {
        const db = await getLocalDb();
        // Fetch pending items
        const pending = await db.all(
            "SELECT * FROM pending_sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 50"
        );

        if (pending.length === 0) {
            isPushing = false;
            return;
        }

        console.log(`[Sync Engine] Found ${pending.length} pending items to push.`);

        for (const item of pending) {
            // Check if we spent more than 10 seconds in this cycle
            if (Date.now() - startTime > MAX_PUSH_TIME) {
                console.log("[Sync Engine] PUSH cycle reached 10s limit. Pausing remaining tasks.");
                break;
            }

            try {
                // The body contains { sql, params }
                const body = JSON.parse(item.body || '{}');
                const sql = body.sql;
                const params = body.params || [];

                if (!sql) {
                    await db.run("UPDATE pending_sync_queue SET status = 'error', last_error = 'No SQL provided' WHERE id = ?", [item.id]);
                    continue;
                }

                // Execute the queued query against the remote source
                await pool.queryRemote(sql, params);

                // Mark as success (remove from queue)
                await db.run("DELETE FROM pending_sync_queue WHERE id = ?", [item.id]);
                console.log(`[Sync Engine] PUSH Success: Item #${item.id}`);

            } catch (err) {
                console.error(`[Sync Engine] PUSH Fail: Item #${item.id}`, err.message);
                await db.run(
                    "UPDATE pending_sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?",
                    [err.message, item.id]
                );

                // If failed too many times, mark as error
                if (item.attempts >= 5) {
                    await db.run("UPDATE pending_sync_queue SET status = 'error' WHERE id = ?", [item.id]);
                }
            }
        }
    } catch (err) {
        console.error("[Sync Engine] Global PUSH Error:", err);
    } finally {
        isPushing = false;
    }
}

// Initial immediate run for Pull
setTimeout(runPull, 1000);

// INTERLEAVED SCHEDULING
// Pull every 60 seconds (as requested)
setInterval(runPull, 60000);

// Push every 30 seconds as a fallback, but we will also trigger it manually
setInterval(runPush, 30000);

/**
 * Trigger an immediate push cycle. 
 * Called by db.js when something is added to the queue.
 */
function triggerPush() {
    if (!isPushing) {
        // Run after 500ms to allow the DB transaction to fully complete
        setTimeout(runPush, 500);
    }
}

function triggerPull() {
    if (!isPulling) {
        setTimeout(runPull, 0);
    }
}

// Global hooks to avoid circular dependencies
global.triggerPush = triggerPush;
global.triggerPull = triggerPull;

module.exports = { runPull, runPush, triggerPush };
