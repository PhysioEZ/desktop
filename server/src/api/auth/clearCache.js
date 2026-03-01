/**
 * NO-OP: SQLite cache clearing is no longer needed in the server-only version.
 */
async function clearCache(req, res) {
    res.json({
        status: 'success',
        message: 'Sync system disabled; server-only mode active.',
        skipped: true
    });
}

module.exports = { clearCache };
