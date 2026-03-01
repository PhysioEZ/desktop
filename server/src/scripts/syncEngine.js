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
    'patients': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['patient_master', 'patients_treatment', 'attendance', 'payments'] },
    'registration': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['patients', 'payments', 'registration_payments', 'attendance'] },
    'tests': { tsCol: 'updated_at', branchCol: 'branch_id', deps: ['test_payments'] },
    'attendance': { tsCol: 'created_at', branchCol: 'patients.branch_id', deps: [] },
    'payments': { tsCol: 'created_at', branchCol: 'patients.branch_id', deps: ['payment_splits'] },
    'quick_inquiry': { tsCol: 'updated_at', branchCol: 'branch_id', deps: [] },
    'test_inquiry': { tsCol: 'updated_at', branchCol: 'branch_id', deps: [] },
    'patient_master': { tsCol: 'first_registered_at', branchCol: 'first_registered_branch_id', deps: [] },
    'employees': { tsCol: 'updated_at', branchCol: 'branch_id', deps: [] },
    'patients_treatment': { tsCol: 'created_at', branchCol: 'patients.branch_id', deps: [] },
    'notifications': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'expenses': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'reception_notes': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'test_staff': { tsCol: 'staff_id', branchCol: 'branch_id', deps: [] },
    'test_types': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'limb_types': { tsCol: 'limb_type_id', branchCol: 'branch_id', deps: [] },
    'chief_complaints': { tsCol: 'complaint_code', branchCol: 'branch_id', deps: [] },
    'referral_sources': { tsCol: 'source_code', branchCol: 'branch_id', deps: [] },
    'consultation_types': { tsCol: 'consultation_code', branchCol: 'branch_id', deps: [] },
    'inquiry_service_types': { tsCol: 'service_code', branchCol: 'branch_id', deps: [] },
    'expense_categories': { tsCol: 'category_id', branchCol: null, deps: [] },
    'service_tracks': { tsCol: 'updated_at', branchCol: null, deps: [] },
    'referral_partners': { tsCol: 'updated_at', branchCol: null, deps: [] },
    'branches': { tsCol: 'branch_id', branchCol: 'branch_id', deps: [] },
    'system_settings': { tsCol: 'updated_at', branchCol: null, deps: [] },
    'test_items': { tsCol: 'created_at', branchCol: null, deps: [] },
    'test_payments': { tsCol: 'created_at', branchCol: null, deps: [] },
    'payment_methods': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'system_issues': { tsCol: 'created_at', branchCol: 'branch_id', deps: [] },
    'system_services': { tsCol: 'last_updated', branchCol: null, deps: [] },
    'registration_payments': { tsCol: 'amount', branchCol: 'branch_id', deps: [] },
    'payment_splits': { tsCol: 'amount', branchCol: null, deps: [] },
    'patient_appointments': { tsCol: 'appointment_date', branchCol: 'branch_id', deps: [] }
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
let activeBranchId = syncMap.branchId || null;
let isPulling = false;
let isPushing = false;
let isInitialSyncComplete = false;
let lastPullTime = 0;
let syncProgress = {
    total: 0,
    completed: 0,
    currentTable: ""
};

function setActiveBranch(branchId) {
    if (activeBranchId !== branchId) {
        console.log(`[Sync Engine] Active Branch set to: ${branchId}`);
        activeBranchId = branchId;
        syncMap.branchId = branchId;
        isInitialSyncComplete = false; // Reset for new branch
        setLastSyncMap(syncMap);
        // Trigger immediate pull for new branch
        triggerPull();
    }
}

function getSyncStatus() {
    return {
        isInitialSyncComplete,
        lastPullTime,
        activeBranchId,
        progress: syncProgress
    };
}

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
        let sql;

        if (meta.branchCol && meta.branchCol.includes('.')) {
            // Table requires join for branch filtering (e.g. attendance)
            const parts = meta.branchCol.split('.');
            const parentTable = parts[0];
            const parentCol = parts[1];
            // Prefix timestamp column to avoid ambiguity
            sql = `SELECT MAX(${table}.${meta.tsCol}) FROM ${table} JOIN ${parentTable} ON ${table}.patient_id = ${parentTable}.patient_id WHERE ${parentTable}.${parentCol} = ${branchId}`;
        } else if (meta.branchCol) {
            sql = `SELECT MAX(${table}.${meta.tsCol}) FROM ${table} WHERE ${meta.branchCol} = ${branchId}`;
        } else {
            sql = `SELECT MAX(${table}.${meta.tsCol}) FROM ${table}`;
        }

        subqueries.push(`(${sql}) as "${table}"`);
    }

    const batchSql = `SELECT ${subqueries.join(', ')}`;

    try {
        const [rows] = await pool.queryRemote(batchSql);
        if (!rows || rows.length === 0) return [];

        const serverTs = rows[0];
        const updatedTables = [];

        const db = await getLocalDb();
        for (const table of tablesToCheck) {
            const localTs = tableTimestamps[table] || startOfTime;
            const remoteTs = serverTs[table];

            // 1. Remote has newer data
            if (remoteTs && remoteTs > localTs) {
                updatedTables.push(table);
                continue;
            }

            // 2. BOOTSTRAP: If local table is empty for THIS branch, we MUST pull it
            try {
                let countSql = `SELECT COUNT(*) as count FROM "${table}"`;
                // For metadata tables, we check branch-specifically to ensure they are populated for this branch
                if (meta.branchCol && !meta.branchCol.includes('.')) {
                    countSql += ` WHERE ${meta.branchCol} = ${branchId}`;
                }

                const countResult = await db.get(countSql);
                if (!countResult || countResult.count === 0) {
                    updatedTables.push(table);
                    continue;
                }
            } catch (e) {
                updatedTables.push(table);
                continue;
            }

            // 3. Fallback for initialization
            if (!remoteTs && localTs === startOfTime) {
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
        let branchId = activeBranchId;

        // Fallback: try to get from SQLite if we have mirrored sessions (optional)
        if (!branchId) {
            try {
                const tokenRow = await db.get(
                    "SELECT e.branch_id FROM api_tokens at JOIN employees e ON at.employee_id = e.employee_id ORDER BY at.last_used_at DESC LIMIT 1"
                );
                if (tokenRow) branchId = tokenRow.branch_id;
            } catch (e) { }
        }

        if (!branchId) {
            console.log("[Sync Engine] Waiting for active branch session...");
            isPulling = false;
            return;
        }

        // 1. SMART IDENTIFICATION: Which tables actually need pulling?
        let tablesToPull = [];
        let isBootstrap = false;
        if (tableHint) {
            tablesToPull = [tableHint, ...(SYNCABLE_TABLES[tableHint]?.deps || [])];
        } else {
            tablesToPull = await detectUpdatedTables(branchId);
            // Check if any of these are because the table is empty
            for (const table of tablesToPull) {
                try {
                    const rowCount = await db.get(`SELECT COUNT(*) as count FROM "${table}"`);
                    if (!rowCount || rowCount.count === 0) isBootstrap = true;
                } catch (e) { isBootstrap = true; }
            }
        }

        if (tablesToPull.length === 0) {
            // No changes detected on server
            console.log("[Smart Sync] Checked All Tables. No changes detected on server.");
            isPulling = false;
            if (!tableHint) isInitialSyncComplete = true;
            return;
        }

        if (isBootstrap) console.log(`[Sync Engine] Initializing Bootstrap Pull for ${tablesToPull.length} tables...`);
        else console.log(`[Sync Engine] Change detected in: ${tablesToPull.join(', ')}`);

        // Update progress for monitoring
        syncProgress.total = tablesToPull.length;
        syncProgress.completed = 0;

        // 2. Fetch updates from source ONLY for affected tables
        for (const table of tablesToPull) {
            syncProgress.currentTable = table;
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
                const prefixedTs = `${table}.${tsCol}`;
                sql += ` AND (${prefixedTs} > ? OR (${prefixedTs} IS NULL AND ? = '2000-01-01 00:00:00'))`;
                sql += ` ORDER BY ${prefixedTs} ASC LIMIT 2000`;
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
                                let val = row[resCol];
                                if (val instanceof Date) {
                                    val = val.getFullYear() + '-' +
                                        String(val.getMonth() + 1).padStart(2, '0') + '-' +
                                        String(val.getDate()).padStart(2, '0') + ' ' +
                                        String(val.getHours()).padStart(2, '0') + ':' +
                                        String(val.getMinutes()).padStart(2, '0') + ':' +
                                        String(val.getSeconds()).padStart(2, '0');
                                }
                                vals.push(val);
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
                }
            } catch (err) {
                await db.run('ROLLBACK');
                console.warn(`[Sync Pull] Fetch fail table ${table}:`, err.message);
            }
            syncProgress.completed++;
        }
        console.log(`[Sync Engine] PULL Complete. Local SQLite synchronized. Status: ${isBootstrap ? 'Bootstrap' : 'Regular'}`);
        if (isBootstrap || !isInitialSyncComplete) {
            isInitialSyncComplete = true;
        }
        lastPullTime = Date.now();
        syncProgress.completed = syncProgress.total;
        syncProgress.currentTable = "";
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
        // Refresh syncMap from disk to capture any manual injections or other process updates
        syncMap = getLastSyncMap();
        const idMappings = syncMap.idMappings || {};

        const pending = await db.all(
            "SELECT * FROM pending_sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 50"
        );
        if (pending.length === 0) {
            isPushing = false;
            return;
        }
        console.log(`[Sync Engine] Found ${pending.length} pending items to push. Syncing queue to server mysql...`);

        for (const item of pending) {
            if (Date.now() - startTime > MAX_PUSH_TIME) {
                console.log("[Sync Engine] PUSH cycle reached 10s limit. Pausing remaining tasks.");
                break;
            }

            try {
                const body = JSON.parse(item.body || '{}');
                const sql = body.sql;
                let params = body.params || [];
                const localId = body.local_id;
                const tableName = body.tableName;

                if (!sql) {
                    await db.run("UPDATE pending_sync_queue SET status = 'error', last_error = 'No SQL provided' WHERE id = ?", [item.id]);
                    continue;
                }

                // --- ID REMAPPING LOGIC ---
                // If any param matches a previously mapped LocalID, replace it with the RemoteID
                let wasRemapped = false;
                params = params.map(val => {
                    // We check all known mappings. 
                    // To be safe, we only map if the value exists as a key in idMappings
                    // We use [Table:LocalID] format for specificity if possible, but for now 
                    // we'll check global mappings for efficiency in fresh-database scenarios.
                    for (const [key, remoteId] of Object.entries(idMappings)) {
                        const [mTable, mLocalId] = key.split(':');
                        if (val == mLocalId) {
                            // Check if the SQL likely refers to this table
                            // We check for the table name or a column like table_id or master_table_id
                            const cleanTable = mTable.replace(/_master$/, ''); // Handle 'patient_master' -> 'patient'
                            if (sql.toLowerCase().includes(mTable.toLowerCase()) ||
                                sql.toLowerCase().includes(cleanTable.toLowerCase())) {
                                wasRemapped = true;
                                return remoteId;
                            }
                        }
                    }
                    return val;
                });

                if (wasRemapped) {
                    console.log(`[Sync Engine] Remapped IDs for Item #${item.id} before push.`);
                }

                // Execute the queued query against the remote source
                const [result] = await pool.queryRemote(sql, params);

                // --- RECORD NEW MAPPING & RECONCILE LOCAL ID ---
                // If this was an INSERT and we have a local_id, record the MySQL insertId
                if (localId && tableName && result && result.insertId) {
                    const remoteId = result.insertId;
                    idMappings[`${tableName}:${localId}`] = remoteId;
                    syncMap.idMappings = idMappings;
                    setLastSyncMap(syncMap);

                    // --- RECONCILE LOCAL SQLITE ID ---
                    // If local ID != remote ID, we must update the local row ID to match the server
                    // to avoid "duplicates" when we pull later.
                    if (localId != remoteId) {
                        try {
                            const pkName = tableName === 'patient_master' ? 'master_patient_id' :
                                tableName === 'registration' ? 'registration_id' :
                                    tableName === 'patients' ? 'patient_id' :
                                        tableName === 'tests' ? 'test_id' : 'id';

                            console.log(`[Sync Engine] Reconciling Local ID: ${tableName} ${localId} -> ${remoteId}`);

                            await db.run('BEGIN TRANSACTION');
                            // 1. Update the record itself
                            await db.run(`UPDATE "${tableName}" SET "${pkName}" = ? WHERE "${pkName}" = ?`, [remoteId, localId]);

                            // 2. Update Foreign Key references in other tables
                            // This is a simple heuristic: check all syncable tables for the ID column
                            for (const table of Object.keys(SYNCABLE_TABLES)) {
                                if (table === tableName) continue;
                                const pragma = await db.all(`PRAGMA table_info("${table}")`);
                                const hasCol = pragma.some(c => c.name.toLowerCase() === pkName.toLowerCase());
                                if (hasCol) {
                                    await db.run(`UPDATE "${table}" SET "${pkName}" = ? WHERE "${pkName}" = ?`, [remoteId, localId]);
                                }
                            }
                            await db.run('COMMIT');
                        } catch (reconcileErr) {
                            await db.run('ROLLBACK');
                            console.error(`[Sync Engine] ID Reconciliation Fail for ${tableName}:`, reconcileErr.message);
                        }
                    }
                }

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

    console.log("[Sync Engine] Starting Event-Driven Service...");

    // One-time bootstrap pull and push on server start
    setTimeout(() => {
        runPull();
        triggerPush();
    }, 1000);

    // NO interval timers — sync is now purely reactive:
    // - triggerPush() is called by db.js after every local-first mutation
    // - triggerPull(table) is called after a successful push in runPush()
    // - syncAndVerify() is called by the frontend via /reception/sync API
}

/**
 * syncAndVerify: Single entry point for "flush local changes then pull fresh".
 * Called by the /reception/sync API endpoint and by WelcomeScreen on login.
 *
 * @param {string|null} tableName - Optional table to target. Null = full smart check.
 * @returns {Promise<{pushed: number, pulled: string[], success: boolean}>}
 */
async function syncAndVerify(tableName = null) {
    const result = { pushed: 0, pulled: [], success: true };

    try {
        // Step 1: Read from Server (Pull) and Update local SQLite if changes found
        await runPull(tableName);

        // Step 2: Push recently updated local operations back to Source Server MySQL
        let pushedCount = 0;
        if (!isPushing) {
            const db = await require('../config/sqlite').getLocalDb();
            const pending = await db.all(
                "SELECT COUNT(*) as count FROM pending_sync_queue WHERE status = 'pending'"
            );
            if (pending[0]?.count > 0) {
                console.log(`[syncAndVerify] Pushing ${pending[0].count} pending local changes...`);
                await runPush();
                pushedCount = pending[0].count;
                result.pushed = pushedCount;
            }
        }

        // Step 3: Read AGAIN from Server (Pull) if any data was just pushed to capture backend triggers/auto-updates
        if (pushedCount > 0) {
            console.log(`[syncAndVerify] Re-syncing from server to capture post-push mutations...`);
            await runPull(tableName);
        }

        result.pulled = tableName ? [tableName] : ['full_check'];

    } catch (err) {
        console.error('[syncAndVerify] Error:', err.message);
        result.success = false;
    }

    return result;
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
global.setActiveBranch = setActiveBranch;
global.getSyncStatus = getSyncStatus;
global.syncAndVerify = syncAndVerify;

module.exports = { runPull, runPush, triggerPush, startSyncEngine, setActiveBranch, getSyncStatus, syncAndVerify, detectUpdatedTables };

// Start the engine automatically when required
startSyncEngine();
