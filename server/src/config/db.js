require('dotenv').config();
const { getLocalDb } = require('./sqlite');
const { AsyncLocalStorage } = require('async_hooks');
const mysql = require('mysql2/promise');

const queryContext = new AsyncLocalStorage();

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
            queueLimit: 0
        });
    }
    return mysqlPool;
}

class SqlitePool {
    async query(sql, params) {
        return this._exec(sql, params);
    }

    async execute(sql, params) {
        return this._exec(sql, params);
    }

    // Explicitly hit the source (MySQL or Bridge)
    async queryRemote(sql, params) {
        return this._exec(sql, params, true);
    }

    async getConnection() {
        return {
            query: async (sql, params) => this._exec(sql, params),
            execute: async (sql, params) => this._exec(sql, params),
            beginTransaction: async () => { },
            commit: async () => { },
            rollback: async () => { },
            release: () => { }
        };
    }

    _translateSql(sql) {
        let newSql = sql;

        // Translate MySQL DATE(x) to SQLite. Handle ISO strings, native calls, and Unix Timestamps (ms)
        newSql = newSql.replace(/DATE\s*\(([^)]+)\)/gi, (match, col) => {
            const c = col.trim();
            // If it contains a comma or is a native call like 'now', 'localtime', just pass it as date(...)
            if (c.includes(',') || /'now'|'localtime'/i.test(c)) {
                return `date(${c})`;
            }
            // Robust check: if it looks like a number (timestamp), convert it. Otherwise treat as ISO.
            return `(CASE WHEN typeof(${c}) IN ('integer', 'real') THEN date(${c}/1000, 'unixepoch', 'localtime') ELSE date(${c}) END)`;
        });

        // Translate MySQL DATE_SUB(source, INTERVAL X UNIT) to SQLite
        newSql = newSql.replace(/DATE_SUB\s*\(([^,]+),\s*INTERVAL\s+(\d+)\s+(DAY|MONTH|YEAR|HOUR|MINUTE|SECOND)\s*\)/gi, (match, source, amount, unit) => {
            let s = source.trim();
            if (/CURDATE\s*\(\s*\)/i.test(s)) s = "date('now', 'localtime')";
            else if (/NOW\s*\(\s*\)/i.test(s)) s = "datetime('now', 'localtime')";
            return `datetime(${s}, '-${amount} ${unit.toLowerCase()}s')`;
        });

        // Translate MySQL ON DUPLICATE KEY UPDATE to SQLite ON CONFLICT
        // Specialized for daily_patient_counter (primary bottleneck for ID generation)
        if (newSql.toLowerCase().includes('daily_patient_counter')) {
            newSql = newSql.replace(/INSERT INTO daily_patient_counter\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*ON DUPLICATE KEY UPDATE/gi, (match, cols, vals) => {
                return `INSERT INTO daily_patient_counter (${cols}) VALUES (${vals}) ON CONFLICT(entry_date) DO UPDATE SET`;
            });
        }

        // Translate CURDATE() to date('now', 'localtime')
        newSql = newSql.replace(/CURDATE\s*\(\s*\)/gi, "date('now', 'localtime')");

        // Translate NOW() to datetime('now', 'localtime')
        newSql = newSql.replace(/NOW\s*\(\s*\)/gi, "datetime('now', 'localtime')");

        // Translate MySQL GREATEST to SQLite MAX
        newSql = newSql.replace(/GREATEST\s*\(/gi, "MAX(");

        // Translate CAST(x AS DECIMAL(m,n)) to CAST(x AS REAL)
        newSql = newSql.replace(/CAST\s*\(([^)]+)\s+AS\s+DECIMAL\s*\([^)]*\)\s*\)/gi, 'CAST($1 AS REAL)');

        // Translate MySQL CONCAT(a, b) to a || b. Improved to handle nested commas in arguments (like COALESCE).
        newSql = newSql.replace(/CONCAT\s*\(((?:[^(),]+|\([^()]*\))+),\s*([^)]+)\)/gi, '($1 || $2)');

        // Translate MySQL IF(c, t, f) to CASE WHEN c THEN t ELSE f END. Handles nested commas in arguments.
        newSql = newSql.replace(/IF\s*\(((?:[^(),]+|\([^()]*\))+),((?:[^(),]+|\([^()]*\))+),([^)]+)\)/gi, "CASE WHEN $1 THEN $2 ELSE $3 END");

        // Ignore SET statements (MySQL specific boilerplate)
        if (/^\s*SET\s+/i.test(newSql) || /^\s*NAMES\s+/i.test(newSql) || /^\s*SET\s+NAMES/i.test(newSql) || /^\s*\/\*.*\*\/\s*SET\s+/i.test(newSql)) {
            return "SELECT 1";
        }

        return newSql;
    }

    async _fetchWithRetry(url, options, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            } catch (err) {
                if (i === retries) throw err;
                await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
        }
    }

    async _exec(sql, params, forceRemoteInternal = false) {
        const translatedSql = this._translateSql(sql);
        const db = await getLocalDb();

        const isSelect = /^\s*\(?\s*(SELECT|PRAGMA|WITH|SHOW|DESCRIBE)/i.test(translatedSql);
        const context = queryContext.getStore() || {};
        const forceRemote = forceRemoteInternal || context.forceRemote;
        const skipMirror = context.skipMirror || false;

        // AUTH/SETTINGS tables always go to remote for consistency
        const isAuthOrSettings = /employees|system_settings|api_tokens|roles|users|chat_messages|daily_patient_counter/i.test(sql);

        // 1. Handling SELECT (Read)
        if (isSelect) {
            if (!isAuthOrSettings && !forceRemote) {
                try {
                    let rows = await db.all(translatedSql, params || []);

                    // LAZY LOADING: If empty and it's a main syncable table, trigger background sync and source hit
                    const isMainTable = /patients|registration|tests|quick_inquiry|test_inquiry|attendance|notifications|payments|expenses|system_issues|system_services|issue_attachments|patient_feedback|service_tracks|referral_partners|branches|payment_methods|test_types|test_items|test_payments|tokens|patient_master|test_staff|limb_types|chief_complaints|referral_sources|consultation_types|inquiry_service_types|expense_categories|patient_appointments|registration_payments|payment_splits/i.test(sql);
                    if (rows.length === 0 && isMainTable && !context.isRetrying) {
                        console.log(`[Lazy Load] SQLite empty for ${sql.slice(0, 50)}... Fetching from source to initialize.`);
                        return await queryContext.run({ ...context, isRetrying: true, forceRemote: true }, async () => {
                            return await this._hitSource(sql, params, true);
                        });
                    }

                    return [rows, []];
                } catch (err) {
                    console.error("[SQLite Select Error]", translatedSql, err.message);
                    throw err;
                }
            } else {
                // Forced Remote Read (e.g. Refresh or Auth)
                return this._hitSource(sql, params, true, skipMirror);
            }
        }

        // 2. Handling Mutations (INSERT, UPDATE, DELETE)
        else {
            if (isAuthOrSettings || forceRemote) {
                // Important stuff hits MySQL immediately
                return this._hitSource(sql, params, false, skipMirror);
            } else {
                // LOCAL-FIRST MUTATION
                // Write to SQLite immediately for instant UI update
                try {
                    const result = await db.run(translatedSql, params || []);

                    // Queue for background sync
                    // Enhanced to include table name and local_id for dependency resolution
                    let tableName = null;
                    const insertMatch = sql.match(/INSERT\s+INTO\s+["`]?(\w+)["`]?/i);
                    if (insertMatch) tableName = insertMatch[1].toLowerCase();

                    await db.run(
                        "INSERT INTO pending_sync_queue (action, url, method, body) VALUES (?, ?, ?, ?)",
                        ["sync_push", "local_mysql", "POST", JSON.stringify({
                            sql,
                            params: params || [],
                            local_id: insertMatch ? result.lastID : null,
                            tableName
                        })]
                    );

                    console.log(`[Local-First] Saved data to local SQLite. Action: ${sql.slice(0, 40)}... Successful.`);


                    // Trigger sync push immediately
                    if (global.triggerPush) global.triggerPush();

                    return [{
                        insertId: result.lastID,
                        affectedRows: result.changes
                    }, []];
                } catch (err) {
                    console.error("[SQLite Local-First Error]", err.message);
                    throw err;
                }
            }
        }
    }

    async _hitSource(sql, params, isSelect, skipMirror = false) {
        let sourceResults;
        let sourceInsertId, sourceAffectedRows;

        try {
            if (process.env.USE_LOCAL_MYSQL === 'true') {
                const pool = getMysqlPool();
                const [rows, fields] = await pool.query(sql, params || []);
                sourceResults = rows;
                if (!isSelect) {
                    sourceInsertId = rows.insertId;
                    sourceAffectedRows = rows.affectedRows;
                }
            } else {
                const url = process.env.BRIDGE_URL;
                const token = process.env.BRIDGE_TOKEN;

                const response = await this._fetchWithRetry(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sql, params: params || [] })
                });

                const text = await response.text();
                let remoteData = JSON.parse(text);

                if (!remoteData.success) throw new Error(remoteData.message || 'Bridge execution failed');

                if (Array.isArray(remoteData.data)) {
                    sourceResults = remoteData.data;
                } else {
                    sourceResults = remoteData.data;
                    sourceInsertId = remoteData.data.insertId;
                    sourceAffectedRows = remoteData.data.affectedRows;
                }
            }

            // Mirror to SQLite if it was a successful remote write OR a remote read
            if (!isSelect) {
                const db = await getLocalDb();
                const translatedSql = this._translateSql(sql);
                await db.run(translatedSql, params || []);
            } else if (!skipMirror && Array.isArray(sourceResults) && sourceResults.length > 0) {
                // Determine table name if possible for mirroring
                const tableMatch = sql.match(/FROM\s+["`]?(\w+)["`]?/i);
                if (tableMatch) {
                    const tableName = tableMatch[1].toLowerCase();
                    // DO NOT mirror auth or settings tables
                    const isSystemTable = /employees|system_settings|api_tokens|roles|users/i.test(tableName);

                    if (!isSystemTable) {
                        const db = await getLocalDb();
                        // Get actual SQLite table columns to filter out JOIN-computed columns
                        let tableColumns;
                        let primaryKeys = [];
                        try {
                            const pragma = await db.all(`PRAGMA table_info("${tableName}")`);
                            // Store as lowercase for case-insensitive matching
                            tableColumns = new Map(pragma.map(c => [c.name.toLowerCase(), c.name]));
                            primaryKeys = pragma.filter(c => c.pk > 0).map(c => c.name.toLowerCase());
                        } catch (e) {
                            console.warn(`[Mirror] Could not get schema for ${tableName}:`, e.message);
                            tableColumns = null;
                        }

                        if (tableColumns) {
                            let mirroredCount = 0;
                            for (const row of sourceResults) {
                                const allResultCols = Object.keys(row);
                                // Filter to columns that exist in SQLite, mapping to correct case
                                const cols = [];
                                const vals = [];

                                allResultCols.forEach(resCol => {
                                    const lower = resCol.toLowerCase();
                                    if (tableColumns.has(lower)) {
                                        cols.push(tableColumns.get(lower));
                                        vals.push(row[resCol]);
                                    }
                                });

                                if (cols.length === 0) continue;

                                // CRITICAL: Only mirror if we have the primary key(s)
                                // Partial selects (like dropdown options) should NOT be mirrored into the main table
                                const resultColsLower = cols.map(c => c.toLowerCase());
                                const hasAllPKs = primaryKeys.every(pk => resultColsLower.includes(pk));

                                if (!hasAllPKs && primaryKeys.length > 0) {
                                    // Skip partial mirroring
                                    continue;
                                }

                                // CRITICAL: Mirror Protection
                                // If this row has a pending sync in SQLite, do NOT overwrite it with potentially stale remote data
                                if (primaryKeys.length > 0) {
                                    const pkValues = primaryKeys.map(pk => row[cols[resultColsLower.indexOf(pk)]]);

                                    const pending = await db.get(
                                        `SELECT 1 FROM pending_sync_queue WHERE body LIKE ? AND body LIKE ?`,
                                        [`%${tableName}%`, `%${pkValues[0]}%`] // Simple heuristic for ID matching in JSON body
                                    );

                                    if (pending) {
                                        // Skip mirroring to protect local un-synced change
                                        continue;
                                    }
                                }

                                const placeholders = cols.map(() => '?').join(', ');
                                const colNames = cols.map(c => `"${c}"`).join(', ');
                                try {
                                    await db.run(`REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`, vals);
                                    mirroredCount++;
                                } catch (e) {
                                    console.warn(`[Mirror Fail] Table ${tableName}:`, e.message);
                                }
                            }
                            if (mirroredCount > 0) {
                                console.log(`[Mirror] Mirrored ${mirroredCount} rows to ${tableName}`);
                            }
                        }
                    }
                }
            }

            if (isSelect) return [sourceResults, []];
            return [{ insertId: sourceInsertId, affectedRows: sourceAffectedRows }, []];

        } catch (err) {
            console.error(`[Source Error] SQL: ${sql.slice(0, 100)}... Error: ${err.message}`);
            throw new Error(isSelect ? "Unable to fetch data from source." : "Unable to save to source.");
        }
    }
}

const pool = new SqlitePool();
pool.queryContext = queryContext;
module.exports = pool;
