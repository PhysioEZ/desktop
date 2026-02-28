const pool = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
        }

        // Validate token against DB
        const [rows] = await pool.query(`
            SELECT at.*, e.employee_id, e.branch_id, r.role_name
            FROM api_tokens at
            JOIN employees e ON at.employee_id = e.employee_id
            JOIN roles r ON e.role_id = r.role_id
            WHERE at.token = ? 
            AND at.expires_at > NOW()
            AND at.is_revoked = 0
            AND e.is_active = 1
            LIMIT 1
        `, [token]);

        if (rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
        }

        const user = rows[0];
        req.user = {
            employee_id: user.employee_id,
            branch_id: user.branch_id,
            role: user.role_name,
            token_id: user.token_id
        };

        // Update last used (Async)
        pool.query("UPDATE api_tokens SET last_used_at = NOW() WHERE token_id = ?", [user.token_id]).catch(console.error);

        // Start Sync Engine and set correct branch
        if (global.setActiveBranch) {
            global.setActiveBranch(user.branch_id);
        }
        if (global.startSyncEngine) {
            global.startSyncEngine();
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
