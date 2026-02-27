const { getLocalDb } = require('../../config/sqlite');

/**
 * Clear all cached data from SQLite.
 * Called on login to ensure the local DB is purged of stale data.
 * The pending_sync_queue is preserved to avoid losing unsynced mutations.
 */
async function clearCache(req, res) {
    try {
        const db = await getLocalDb();

        // 1. Check for 1-hour delay
        const lastPurgeSetting = await db.get("SELECT setting_value FROM system_settings WHERE setting_key = 'last_purge_time'");
        const lastPurge = lastPurgeSetting ? parseInt(lastPurgeSetting.setting_value) : 0;
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (now - lastPurge < oneHour) {
            console.log(`[ClearCache] Skipped. Last purge was ${Math.round((now - lastPurge) / 1000 / 60)} mins ago.`);
            return res.json({
                status: 'success',
                message: 'Cache is already fresh (purged less than 1hr ago)',
                skipped: true
            });
        }

        // 2. Get all table names except pending_sync_queue and sqlite internals
        const tables = await db.all(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('pending_sync_queue', 'sqlite_sequence', 'system_settings')`
        );

        let cleared = 0;
        for (const table of tables) {
            try {
                await db.run(`DELETE FROM "${table.name}"`);
                cleared++;
            } catch (err) {
                console.warn(`[ClearCache] Skipped table ${table.name}:`, err.message);
            }
        }

        // 3. Update last purge time
        await db.run(
            `INSERT INTO system_settings (setting_key, setting_value) VALUES ('last_purge_time', ?) 
             ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
            [now.toString()]
        );

        console.log(`[ClearCache] Cleared ${cleared} tables from SQLite.`);

        res.json({
            status: 'success',
            message: `Cleared ${cleared} tables`,
            tables_cleared: cleared
        });
    } catch (err) {
        console.error('[ClearCache] Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to clear cache'
        });
    }
}

module.exports = { clearCache };
