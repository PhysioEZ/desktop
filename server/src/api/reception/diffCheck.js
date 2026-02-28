const { getLocalDb } = require('../../config/sqlite');
const { detectUpdatedTables, runPull, getSyncStatus } = require('../../scripts/syncEngine');

/**
 * POST /api/reception/diff_check
 * 
 * Differential sync: Compare local SQLite state against the server.
 * - If data is < 1hr old, skip the full cache purge and only pull changed tables.
 * - If data is > 1hr old or empty, fall back to full sync.
 * 
 * Body: { branch_id: number }
 */
exports.diffCheck = async (req, res) => {
    try {
        const { branch_id } = req.body || {};
        if (!branch_id) {
            return res.status(400).json({ success: false, message: 'branch_id is required' });
        }

        const { setActiveBranch } = require('../../scripts/syncEngine');
        setActiveBranch(branch_id);

        const db = await getLocalDb();

        // 1. Check how old the local data is
        const lastPurgeSetting = await db.get(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'last_purge_time'"
        );
        const lastPurge = lastPurgeSetting ? parseInt(lastPurgeSetting.setting_value) : 0;
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const dataAge = now - lastPurge;
        const isDataFresh = dataAge < oneHour && lastPurge > 0;

        // 2. Check if we actually have data in SQLite
        let hasLocalData = false;
        try {
            const patientCount = await db.get('SELECT COUNT(*) as count FROM patients');
            hasLocalData = patientCount && patientCount.count > 0;
        } catch (e) {
            hasLocalData = false;
        }

        // 3. If data is fresh AND we have local data, do a differential check
        if (isDataFresh && hasLocalData) {
            console.log(`[DiffCheck] Data is ${Math.round(dataAge / 1000 / 60)}min old. Running differential sync...`);

            const updatedTables = await detectUpdatedTables(branch_id);

            if (updatedTables.length === 0) {
                console.log('[DiffCheck] No changes detected on server. SQLite is up to date.');
                return res.json({
                    success: true,
                    mode: 'differential',
                    changed_tables: [],
                    message: 'Local data is already up to date',
                    data_age_minutes: Math.round(dataAge / 1000 / 60)
                });
            }

            console.log(`[DiffCheck] ${updatedTables.length} tables have changes: ${updatedTables.join(', ')}`);

            // Pull only the changed tables
            for (const table of updatedTables) {
                await runPull(table);
            }

            return res.json({
                success: true,
                mode: 'differential',
                changed_tables: updatedTables,
                message: `Synced ${updatedTables.length} changed tables`,
                data_age_minutes: Math.round(dataAge / 1000 / 60)
            });
        }

        // 4. Data is stale or empty — signal the caller to do a full sync
        console.log(`[DiffCheck] Data is ${lastPurge === 0 ? 'empty' : Math.round(dataAge / 1000 / 60) + 'min old'}. Full sync recommended.`);

        return res.json({
            success: true,
            mode: 'full_sync_needed',
            changed_tables: [],
            message: lastPurge === 0 ? 'No local data found' : 'Data is older than 1 hour',
            data_age_minutes: lastPurge === 0 ? null : Math.round(dataAge / 1000 / 60)
        });

    } catch (err) {
        console.error('[DiffCheck] Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
