const sqlite = require('../config/sqlite');
const BridgeService = require('./BridgeService');

// Priority tables fetched immediately on login
const PRIORITY_TABLES = [
    'registration', 'patients', 'tests',
    'attendance', 'payments', 'quick_inquiry', 'test_inquiry',
    'patients_treatment'  // plan history needed for financial calculations
];


// Deferred tables fetched after a delay (metadata / config)
const DEFERRED_TABLES = [
    'patient_master', 'employees', 'roles',
    'branches', 'payment_methods', 'service_tracks',
    'notifications', 'expenses', 'system_settings'
    // notes, referral_partners, app_updates excluded — don't exist in MySQL yet
];



// Primary key map for each table
const PK_MAP = {
    tests: 'test_id',
    attendance: 'attendance_id',
    patients: 'patient_id',
    registration: 'registration_id',
    quick_inquiry: 'inquiry_id',
    test_inquiry: 'inquiry_id',
    payments: 'payment_id',
    patients_treatment: 'treatment_id',  // FIX: MySQL PK is treatment_id
    patient_master: 'master_patient_id',
    employees: 'employee_id',
    roles: 'role_id',
    branches: 'branch_id',
    payment_methods: 'method_id',
    service_tracks: 'id',
    notifications: 'notification_id',
    expenses: 'expense_id',
    system_settings: 'setting_key',  // FIX: MySQL PK is setting_key (TEXT), no setting_id
    api_tokens: 'token_id'
};


class SyncService {
    static lastSyncTime = 0;
    static isSyncing = false;

    /**
     * ----------------------------------------------------------------
     * CORE: Pull a single table (paginated to avoid Hostinger timeouts)
     * ----------------------------------------------------------------
     */
    static async pullTable(table, userToken, branchId = null) {
        console.log(`[Sync] Pulling table: ${table}...`);
        const PAGE_SIZE = 500;
        let offset = 0;
        let totalFetched = 0;

        try {
            while (true) {
                const options = { limit: PAGE_SIZE, offset, pk: PK_MAP[table] || 'id' };
                if (branchId) options.branch_id = branchId;

                const response = await BridgeService.read(table, null, options, userToken);
                const rows = response.data;

                if (!rows || rows.length === 0) break;

                const columns = Object.keys(rows[0]);
                const placeholders = columns.map(() => '?').join(',');
                const colNames = columns.join(',');
                const updateSet = columns.map(c => `${c}=excluded.${c}`).join(',');

                const upsert = sqlite.prepare(`
                    INSERT INTO ${table} (${colNames}, _last_synced_at)
                    VALUES (${placeholders}, CURRENT_TIMESTAMP)
                    ON CONFLICT DO UPDATE SET ${updateSet}, _last_synced_at=CURRENT_TIMESTAMP
                `);

                const transaction = sqlite.transaction((data) => {
                    for (const row of data) {
                        const values = columns.map(col => row[col]);
                        upsert.run(...values);
                    }
                });

                transaction(rows);
                totalFetched += rows.length;

                if (rows.length < PAGE_SIZE) break; // Last page
                offset += PAGE_SIZE;
            }

            sqlite.prepare(
                "INSERT INTO sync_history (table_name, last_sync_at) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at"
            ).run(table);

            console.log(`[Sync] ✓ ${table}: ${totalFetched} rows`);
            return totalFetched;
        } catch (error) {
            console.error(`[Sync] ✗ ${table}: ${error.message}`);
            return 0;
        }
    }

    /**
     * ----------------------------------------------------------------
     * EVENT-DRIVEN: Re-sync a specific table after a write event
     * ----------------------------------------------------------------
     */
    static async syncTable(table, userToken, branchId = null) {
        // Don't block — fire and forget from caller perspective
        try {
            await this.pullTable(table, userToken, branchId);
            console.log(`[Sync] Event-sync complete for: ${table}`);
        } catch (err) {
            console.error(`[Sync] Event-sync failed for ${table}:`, err.message);
        }
    }

    /**
     * ----------------------------------------------------------------
     * BOOTSTRAP: Initial sync on login
     *   wave = 'priority' | 'deferred' | 'all'
     * ----------------------------------------------------------------
     */
    static async initialSync(userToken, wave = 'priority', branchId = null) {
        const tables = wave === 'priority' ? PRIORITY_TABLES
            : wave === 'deferred' ? DEFERRED_TABLES
                : [...PRIORITY_TABLES, ...DEFERRED_TABLES];

        console.log(`[Sync] Starting ${wave} wave (${tables.length} tables)...`);

        for (const table of tables) {
            await this.pullTable(table, userToken, branchId);
        }

        console.log(`[Sync] ${wave} wave complete.`);
    }

    /**
     * ----------------------------------------------------------------
     * AUTO-SYNC: Periodic background trigger (debounced)
     * ----------------------------------------------------------------
     */
    static async triggerSync(userToken, force = false) {
        const now = Date.now();
        if (this.isSyncing) return;
        if (!force && (now - this.lastSyncTime < 30000)) return; // 30s debounce

        this.isSyncing = true;
        console.log('[Sync] Auto-sync started...');

        try {
            await this.pushChanges(userToken);
            await this.deltaPull(userToken);
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.error('[Sync] Auto-sync failed:', error.message);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * ----------------------------------------------------------------
     * DELTA PULL: Only fetch rows changed since last sync
     * ----------------------------------------------------------------
     */
    static async deltaPull(userToken) {
        const row = sqlite.prepare("SELECT MIN(last_sync_at) as last_sync FROM sync_history").get();
        const since = row?.last_sync || '2000-01-01 00:00:00';

        try {
            const response = await BridgeService.getChanges(since, userToken);
            const { changes } = response;

            if (changes) {
                for (const [table, rows] of Object.entries(changes)) {
                    if (!rows || rows.length === 0) continue;

                    // DEFENSE: Verify table exists locally before preparing SQL
                    const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
                    if (!tableCheck) {
                        console.warn(`[Sync] Delta: Skipping ${table} (not found in local cache)`);
                        continue;
                    }

                    try {
                        const columns = Object.keys(rows[0]);
                        const placeholders = columns.map(() => '?').join(',');
                        const colNames = columns.join(',');
                        const updateSet = columns.map(c => `${c}=excluded.${c}`).join(',');

                        const upsert = sqlite.prepare(`
                            INSERT INTO ${table} (${colNames}, _last_synced_at)
                            VALUES (${placeholders}, CURRENT_TIMESTAMP)
                            ON CONFLICT DO UPDATE SET ${updateSet}, _last_synced_at=CURRENT_TIMESTAMP
                        `);

                        const transaction = sqlite.transaction((data) => {
                            for (const r of data) {
                                upsert.run(...columns.map(col => r[col]));
                            }
                        });

                        transaction(rows);
                        console.log(`[Sync] Delta: ${rows.length} rows updated in ${table}`);
                    } catch (tblErr) {
                        console.error(`[Sync] Delta: Failed to update ${table}:`, tblErr.message);
                    }
                }

            }
        } catch (error) {
            console.error('[Sync] Delta pull failed:', error.message);
        }
    }

    /**
     * ----------------------------------------------------------------
     * PUSH: Send locally pending rows to remote
     * ----------------------------------------------------------------
     */
    static async pushChanges(userToken) {
        const tables = [...PRIORITY_TABLES, ...DEFERRED_TABLES];
        const allOperations = [];

        for (const table of tables) {
            const pk = PK_MAP[table] || 'id';
            let pending = [];

            try {
                // DEFENSE: Verify table and column exists
                const hasCol = sqlite.prepare("SELECT count(*) as count FROM pragma_table_info(?) WHERE name='_sync_status'").get(table);
                if (!hasCol || hasCol.count === 0) continue;

                pending = sqlite.prepare(`SELECT * FROM ${table} WHERE _sync_status = 'pending'`).all();
            } catch (err) {
                continue; // Table might be missing entirely
            }


            for (const row of pending) {
                const data = { ...row };
                delete data._sync_status;
                delete data._last_synced_at;

                allOperations.push({
                    table,
                    action: row[pk] ? 'update' : 'insert',
                    data,
                    pk,
                    pk_val: row[pk]
                });
            }
        }

        if (allOperations.length > 0) {
            try {
                const response = await BridgeService.batch(allOperations, userToken);
                if (response.success) {
                    for (const op of allOperations) {
                        sqlite.prepare(
                            `UPDATE ${op.table} SET _sync_status = 'synced', _last_synced_at = CURRENT_TIMESTAMP WHERE ${op.pk} = ?`
                        ).run(op.pk_val);
                    }
                    console.log(`[Sync] Pushed ${allOperations.length} pending changes.`);
                }
            } catch (error) {
                console.error('[Sync] Push failed:', error.message);
            }
        }
    }
}

module.exports = SyncService;
module.exports.PRIORITY_TABLES = PRIORITY_TABLES;
module.exports.DEFERRED_TABLES = DEFERRED_TABLES;
