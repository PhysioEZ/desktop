const sqlite = require('../../config/sqlite');

/**
 * GET /api/reception/check_updates?last_sync=ISO&tables[]=patients&tables[]=attendance
 *
 * Batch 6 optimization: instead of hitting remote MySQL for COUNT(*) on 8 tables,
 * we answer from the local sync_history table which tracks last_sync_at per table.
 *
 * If sync_history.last_sync_at > last_sync sent by the frontend, the table was
 * refreshed since the client last knew about it — so there may be new data.
 *
 * This reduces check_updates from 8 parallel MySQL round-trips to a single
 * sub-millisecond SQLite read.
 */
exports.checkUpdates = async (req, res) => {
    try {
        const branchId = req.user?.branch_id || req.query.branch_id;
        const lastSync = req.query.last_sync; // ISO string

        if (!branchId || !lastSync) {
            return res.status(400).json({ success: false, message: 'Branch ID and last_sync timestamp are required' });
        }

        const lastSyncDate = new Date(lastSync);
        if (isNaN(lastSyncDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid last_sync timestamp' });
        }

        // Convert ISO string to local format (YYYY-MM-DD HH:MM:SS)
        // to compare with SQLite sync_history timestamps strings
        const tzOffsetMs = lastSyncDate.getTimezoneOffset() * 60000;
        const localSyncDate = new Date(lastSyncDate.getTime() - tzOffsetMs);
        const mysqlTimestamp = localSyncDate.toISOString().slice(0, 19).replace('T', ' ');

        // Accept optional table filter — if provided, only check those tables.
        // If not provided, check all core tables.
        const reqTables = req.query.tables; // may be undefined, string, or array
        const DEFAULT_TABLES = [
            'registration', 'tests', 'patients', 'quick_inquiry',
            'test_inquiry', 'attendance', 'payments', 'notifications',
            'patients_treatment', 'expenses', 'notes'
        ];

        let checkTables;
        if (reqTables) {
            checkTables = Array.isArray(reqTables) ? reqTables : [reqTables];
        } else {
            checkTables = DEFAULT_TABLES;
        }

        // Single SQLite query: get last_sync_at for all requested tables at once
        const placeholders = checkTables.map(() => '?').join(', ');
        const rows = sqlite.prepare(
            `SELECT table_name, last_sync_at FROM sync_history WHERE table_name IN (${placeholders})`
        ).all(...checkTables);

        // Build a map: table -> last_sync_at
        const syncMap = {};
        rows.forEach(r => { syncMap[r.table_name] = r.last_sync_at; });

        const changes = {};
        let hasChanges = false;

        for (const table of checkTables) {
            const tableSyncAt = syncMap[table];
            if (!tableSyncAt) continue; // never synced — nothing to report yet

            // If the table was synced more recently than what the frontend knows,
            // the frontend should refetch that table.
            if (tableSyncAt > mysqlTimestamp) {
                hasChanges = true;
                changes[table] = { updated: true, last_sync_at: tableSyncAt };
            }
        }

        res.json({
            success: true,
            hasChanges,
            changes,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        console.error('Check Updates Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
