const { syncAndVerify, getSyncStatus } = require('../../scripts/syncEngine');

/**
 * POST /api/reception/sync
 * Unified sync endpoint: flush pending pushes, then pull fresh data.
 * Body: { table?: string } — optional table name for targeted sync.
 */
exports.sync = async (req, res) => {
    try {
        const { table } = req.body || {};
        const branch_id = req.user?.branch_id || req.body?.branch_id;

        if (branch_id) {
            const { setActiveBranch } = require('../../scripts/syncEngine');
            setActiveBranch(branch_id);
        }

        const result = await syncAndVerify(table || null);

        res.json({
            success: result.success,
            pushed: result.pushed,
            pulled: result.pulled,
            ...getSyncStatus()
        });
    } catch (err) {
        console.error('[Sync API] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
