const SyncService = require('../../services/SyncService');

/**
 * POST /api/reception/init_sync
 *
 * Responds to the frontend in <5ms. All sync happens 100% in background.
 *
 * PRIORITY tables (8 core tables) start immediately.
 * DEFERRED tables (metadata/config) start after 15s — once the user
 * is safely on the dashboard and the server is idle.
 *
 * The welcome screen navigates on its own 4.5s timer regardless.
 */
exports.initSync = async (req, res) => {
    const userToken = req.user.token;
    const branchId = req.user.branch_id;

    // Respond to the client immediately — do NOT await anything
    res.json({
        success: true,
        message: 'Background sync started.',
    });

    // Priority wave — fire and forget (no await)
    SyncService.initialSync(userToken, 'priority', branchId)
        .then(() => console.log('[initSync] Priority wave complete.'))
        .catch(err => console.error('[initSync] Priority wave error:', err.message));

    // Deferred wave — start 2 minutes later, fully in background
    setTimeout(() => {
        SyncService.initialSync(userToken, 'deferred', branchId)
            .then(() => console.log('[initSync] Deferred wave complete.'))
            .catch(err => console.error('[initSync] Deferred wave error:', err.message));
    }, 120000);

};

/**
 * POST /api/reception/sync_table
 * Event-driven: called after any write to re-sync a specific table.
 * Body: { table: 'registration' }  OR  { tables: ['registration', 'patients'] }
 */
exports.syncTable = async (req, res) => {
    const userToken = req.user.token;
    const branchId = req.user.branch_id;
    const { table, tables } = req.body;

    const tablesToSync = tables ? tables : table ? [table] : [];

    if (tablesToSync.length === 0) {
        return res.status(400).json({ success: false, message: 'Provide table or tables[]' });
    }

    // Respond immediately
    res.json({ success: true, message: `Syncing: ${tablesToSync.join(', ')}` });

    // Background sync — each table independently so one failure doesn't block others
    for (const t of tablesToSync) {
        SyncService.syncTable(t, userToken, branchId).catch(err =>
            console.error(`[syncTable] ${t} failed:`, err.message)
        );
    }
};
