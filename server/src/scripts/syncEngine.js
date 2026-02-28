const { getLocalDb } = require('../config/sqlite');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const lastSyncMapFile = path.join(__dirname, '../../database/sync_status.json');

/**
 * Metadata for all syncable tables.
 * branchCol: The column used to filter by branch in MySQL.
 * tsCol: The column used to detect changes.
 * dependencies: Tables that should also be checked if this table changes.
 */
const SYNCABLE_TABLES = {
    'patients': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['patient_master', 'patients_treatment'] },
    'registration': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['patients', 'payments'] },
    'tests': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['test_payments'] },
    'attendance': { tsCol: 'created_at', branchCol: 'patients.branch_id', deps: [] },
    'payments': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'quick_inquiry': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'test_inquiry': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'patient_master': { tsCol: 'first_registered_at', branchCol: 'first_registered_branch_id', deps: [] },
    'employees': { tsCol: 'updated_at', branchCol: 'branch_id', deps: [] },
    'patients_treatment': { tsCol: 'created_at', branchCol: 'patients.branch_id', deps: [] },
    'notifications': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'expenses': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'reception_notes': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'referral_partners': { tsCol: 'partner_id', branchCol: null, deps: [] },
    'roles': { tsCol: 'role_id', branchCol: null, deps: [] },
    'branches': { tsCol: 'branch_id', branchCol: 'branch_id', deps: [] },
    'system_settings': { tsCol: 'updated_at', branchCol: null, deps: [] },
    'users': { tsCol: 'id', branchCol: null, deps: [] },
    'test_items': { tsCol: 'created_at', branchCol: null, deps: [] },
    'test_payments': { tsCol: 'created_at', branchCol: null, deps: [] },
    'test_types': { tsCol: 'test_type_id', branchCol: 'branch_id', deps: [] },
    'payment_methods': { tsCol: 'method_id', branchCol: 'branch_id', deps: [] },
    'system_issues': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'system_services': { tsCol: 'last_updated', branchCol: null, deps: [] },
    'patient_feedback': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'service_tracks': { tsCol: 'created_at', branchCol: null, deps: [] }
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
 * Detects which tables have updates on the remote server using a batch query.
 * This is the "Smart" part of the sync engine.
 */
async function detectUpdatedTables(branchId) {
    const tableTimestamps = syncMap.tables || {};
    const startOfTime = '2000-01-01 00:00:00';

    // Build a batch query to check MAX timestamps for all tables
    let subqueries = [];
    const tablesToCheck = Object.keys(SYNCABLE_TABLES);

    for (const table of tablesToCheck) {
        const meta = SYNCABLE_TABLES[table];
        let sql = `SELECT MAX(${meta.tsCol}) FROM ${table}`;

        if (meta.branchCol) {
            if (meta.branchCol.includes('.')) {
                // Table requires join for branch filtering (e.g. attendance)
                const parts = meta.branchCol.split('.');
                const parentTable = parts[0];
                const parentCol = parts[1];
                // Prefix timestamp column to avoid ambiguity
                sql = `SELECT MAX(${table}.${meta.tsCol}) FROM ${table} JOIN ${parentTable} ON ${table}.patient_id = ${parentTable}.patient_id WHERE ${parentTable}.${parentCol} = ${branchId}`;
            } else {
                sql += ` WHERE ${meta.branchCol} = ${branchId}`;
            }
        }

        subqueries.push(`(${sql}) as "${table}"`);
    }

    const batchSql = `SELECT ${subqueries.join(', ')}`;

    try {
        const [rows] = await pool.queryRemote(batchSql);
        if (!rows || rows.length === 0) return [];

        const serverTs = rows[0];
        const updatedTables = [];

        for (const table of tablesToCheck) {
            const localTs = tableTimestamps[table] || startOfTime;
            const remoteTs = serverTs[table];

            // Check if remote is newer. Handle NULL as "needs initialization" if local is also startOfTime
            if (remoteTs && remoteTs > localTs) {
                updatedTables.push(table);
            } else if (!remoteTs && localTs === startOfTime) {
                // Potential first-time initialization for empty table
                updatedTables.push(table);
            }
        }

        return updatedTables;
    } catch (err) {
        console.error("[Sync Smart Check] Batch detect failed:", err.message);
        // Fallback: check everything if batch fails (or return empty to avoid spam)
        return [];
    }
}

/**
 * TASK: PULL (Fetch from Source -> Local SQLite)
 */
async function runPull(tableHint = null) {
    if (isPulling) return;
    isPulling = true;

    const startTimeStamp = new Date().toLocaleTimeString();
    if (tableHint) console.log(`[Smart Sync] Targeted PULL for ${tableHint} at ${startTimeStamp}`);
    else console.log(`[Sync Engine] Cycle: PULL at ${startTimeStamp}`);

    try {
        const startOfTime = '2000-01-01 00:00:00';
        let changes = {};
        let tableTimestamps = syncMap.tables || {};

        const db = await getLocalDb();

        // 0. Detect active branch for sync
        let branchId = null;
        try {
            const tokenRow = await db.get(
                "SELECT e.branch_id FROM api_tokens at JOIN employees e ON at.employee_id = e.employee_id ORDER BY at.last_used_at DESC LIMIT 1"
            );
            if (tokenRow) branchId = tokenRow.branch_id;
        } catch (e) { }

        if (!branchId) {
            console.log("[Sync Engine] Waiting for active branch session...");
            isPulling = false;
            return;
        }

        // 1. SMART IDENTIFICATION: Which tables actually need pulling?
        let tablesToPull = [];
        if (tableHint) {
            tablesToPull = [tableHint, ...(SYNCABLE_TABLES[tableHint]?.deps || [])];
        } else {
            tablesToPull = await detectUpdatedTables(branchId);
        }

        if (tablesToPull.length === 0) {
            // No changes detected on server
            console.log("[Smart Sync] Checked 26 tables. No changes detected on server.");
            isPulling = false;
            return;
        }

        console.log(`[Sync Engine] Change detected in: ${tablesToPull.join(', ')}`);

        // 2. Fetch updates from source ONLY for affected tables
        for (const table of tablesToPull) {
            const meta = SYNCABLE_TABLES[table];
            if (!meta) continue;

            const tsCol = meta.tsCol;
            let tableSince = tableTimestamps[table] || startOfTime;

            // Optimization: If local table has 0 rows, start from beginning
            try {
                const countResult = await db.get(`SELECT COUNT(*) as count FROM "${table}"`);
                if (!countResult || countResult.count === 0) {
                    tableSince = startOfTime;
                }
            } catch (e) { }

            let sql = `SELECT * FROM ${table} WHERE 1=1`;
            let params = [];

            if (branchId && meta.branchCol) {
                if (meta.branchCol.includes('.')) {
                    // Requires Join for filtering
                    const parts = meta.branchCol.split('.');
                    sql = `SELECT ${table}.* FROM ${table} JOIN ${parts[0]} ON ${table}.patient_id = ${parts[0]}.patient_id WHERE ${parts[0]}.${parts[1]} = ?`;
                } else {
                    sql += ` AND ${meta.branchCol} = ?`;
                }
                params.push(branchId);
            }

            // Sync logic with NULL protection (only pull NULLs on first sync)
            if (tsCol === 'updated_at' || tsCol === 'created_at' || tsCol === 'first_registered_at' || tsCol === 'last_updated') {
                sql += ` AND (${tsCol} > ? OR (${tsCol} IS NULL AND ? = '2000-01-01 00:00:00'))`;
                sql += ` ORDER BY ${tsCol} ASC LIMIT 2000`;
                params.push(tableSince, tableSince);
            }

            try {
                // Use skipMirror context to prevent db.js from double-mirroring
                const [rows] = await pool.queryContext.run({ skipMirror: true }, async () => {
                    return await pool.queryRemote(sql, params);
                });

                if (rows && rows.length > 0) {
                    changes[table] = { rows, tsCol };
                }
            } catch (err) {
                console.error(`[Sync Pull] Fetch fail table ${table}:`, err.message);
            }
        }

        // 3. Merge into local SQLite
        if (Object.keys(changes).length > 0) {
            await db.run('BEGIN TRANSACTION');
            try {
                let anyUpdates = false;
                for (const [table, changeData] of Object.entries(changes)) {
                    const { rows, tsCol } = changeData;

                    let tableColumns, primaryKeys = [];
                    try {
                        const pragma = await db.all(`PRAGMA table_info("${table}")`);
                        tableColumns = new Map(pragma.map(c => [c.name.toLowerCase(), c.name]));
                        primaryKeys = pragma.filter(c => c.pk > 0).map(c => c.name.toLowerCase());
                    } catch (e) { continue; }

                    let latestForTable = tableTimestamps[table] || startOfTime;

                    for (const row of rows) {
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

                        const resultColsLower = cols.map(c => c.toLowerCase());
                        if (primaryKeys.length > 0 && !primaryKeys.every(pk => resultColsLower.includes(pk))) continue;

                        const placeholders = cols.map(() => '?').join(', ');
                        const colNames = cols.map(c => `"${c}"`).join(', ');
                        await db.run(`INSERT OR REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders})`, vals);

                        if (row[tsCol] && row[tsCol] > latestForTable) latestForTable = row[tsCol];
                    }

                    tableTimestamps[table] = latestForTable;
                    anyUpdates = true;
                }
                await db.run('COMMIT');

                if (anyUpdates) {
                    syncMap.tables = tableTimestamps;
                    const allTs = Object.values(tableTimestamps);
                    if (allTs.length > 0) syncMap.global = allTs.sort().pop();
                    setLastSyncMap(syncMap);
                    console.log(`[Sync Engine] PULL Complete. Local SQLite synchronized.`);
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
 */
async function runPush() {
    if (isPushing) return;
    isPushing = true;
    const startTimeStamp = new Date().toLocaleTimeString();
    console.log(`[Sync Engine] Cycle: PUSH at ${startTimeStamp}`);

    const startTime = Date.now();
    const MAX_PUSH_TIME = 10000;

    try {
        const db = await getLocalDb();
        const pending = await db.all(
            "SELECT * FROM pending_sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 50"
        );

        if (pending.length === 0) {
            isPushing = false;
            return;
        }

        console.log(`[Sync Engine] Found ${pending.length} pending items to push.`);

        for (const item of pending) {
            if (Date.now() - startTime > MAX_PUSH_TIME) {
                console.log("[Sync Engine] PUSH cycle reached 10s limit. Pausing remaining tasks.");
                break;
            }

            try {
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
                console.log(`[Sync Engine] PUSH Success: Item #${item.id} (${sql.slice(0, 30)}...)`);

                // SMART SYNC: Trigger a targeted pull for the table that was just pushed
                const tableMatch = sql.match(/UPDATE\s+(\w+)\s+/i) || sql.match(/INSERT\s+INTO\s+(\w+)\s+/i) || sql.match(/DELETE\s+FROM\s+(\w+)\s+/i);
                if (tableMatch) {
                    const changedTable = tableMatch[1].toLowerCase();
                    triggerPull(changedTable);
                }

            } catch (err) {
                console.error(`[Sync Engine] PUSH Fail: Item #${item.id}`, err.message);
                await db.run(
                    "UPDATE pending_sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?",
                    [err.message, item.id]
                );
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

let isEngineStarted = false;

function startSyncEngine() {
    if (isEngineStarted) return;
    isEngineStarted = true;

    console.log("[Sync Engine] Starting Smart Service Cycles...");

    // Initial immediate run for Pull
    setTimeout(runPull, 1000);

    // INTERLEAVED SCHEDULING
    setInterval(runPull, 30000); // 30s for background (smart check makes it cheap)
    setInterval(runPush, 15000); // 15s push frequency
}

function triggerPush() {
    if (!isEngineStarted) return;
    if (!isPushing) {
        setTimeout(runPush, 500);
    }
}

function triggerPull(tableHint = null) {
    if (!isEngineStarted) return;
    if (!isPulling) {
        setTimeout(() => runPull(tableHint), tableHint ? 200 : 0);
    }
}

// Global hooks
global.triggerPush = triggerPush;
global.triggerPull = triggerPull;
global.startSyncEngine = startSyncEngine;

module.exports = { runPull, runPush, triggerPush, startSyncEngine };
