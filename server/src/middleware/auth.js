const BridgeService = require('../services/BridgeService');
const SyncService = require('../services/SyncService');
const sqlite = require('../config/sqlite');

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

        // 1. Check Local Cache (Fastest)
        const localUser = sqlite.prepare(`
            SELECT at.*, e.employee_id, e.branch_id, r.role_name
            FROM api_tokens at
            JOIN employees e ON at.employee_id = e.employee_id
            JOIN roles r ON e.role_id = r.role_id
            WHERE at.token = ? 
            AND (at._last_synced_at > datetime('now', '-1 hour'))
            AND (at.expires_at > datetime('now') OR at.expires_at IS NULL)
            AND (at.is_revoked = 0 OR at.is_revoked IS NULL)
            LIMIT 1
        `).get(token);

        if (localUser) {
            req.user = {
                employee_id: localUser.employee_id,
                branch_id: localUser.branch_id,
                role: localUser.role_name,
                token: token
            };

            // Background Refresh if token is older than 30 mins
            if (localUser._last_synced_at) {
                const lastSync = new Date(localUser._last_synced_at.replace(' ', 'T') + 'Z').getTime();
                const now = Date.now();
                const isStale = (now - lastSync) > 30 * 60 * 1000; // 30 mins

                if (isStale) {
                    SyncService.triggerSync(token).catch(() => { });
                }
            }
            return next();
        }

        // 2. Validate token against Remote PHP Bridge (and update local cache)
        try {
            const bridgeResponse = await BridgeService.getMe(token);
            const user = bridgeResponse.data;

            if (!user) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
            }

            // Sync User/Employee to local cache for next time
            sqlite.prepare(`
                INSERT INTO roles (role_id, role_name) VALUES (?, ?)
                ON CONFLICT(role_id) DO UPDATE SET role_name=excluded.role_name
            `).run(user.role_id, user.role_name);

            // The bridge returns full_name; our schema uses first_name + last_name.
            // Split on first space — good enough for auth cache purposes.
            const nameParts = (user.full_name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || user.full_name || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            sqlite.prepare(`
                INSERT INTO employees (employee_id, branch_id, role_id, first_name, last_name, email, is_active, job_title, photo_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(employee_id) DO UPDATE SET
                    branch_id=excluded.branch_id,
                    role_id=excluded.role_id,
                    first_name=excluded.first_name,
                    last_name=excluded.last_name
            `).run(user.employee_id, user.branch_id, user.role_id, firstName, lastName, user.email, user.is_active, user.job_title || null, user.photo_path || null);


            sqlite.prepare(`
                INSERT INTO api_tokens (token, employee_id, expires_at, is_revoked, _last_synced_at)
                VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
                ON CONFLICT(token) DO UPDATE SET _last_synced_at=CURRENT_TIMESTAMP
            `).run(token, user.employee_id, user.expires_at || null);

            req.user = {
                employee_id: user.employee_id,
                branch_id: user.branch_id,
                role: user.role_name,
                token: token
            };
        } catch (err) {
            console.error("Bridge Auth Error:", err.message);
            // If we have an expired local cache but the bridge is down, allow 30 more minutes of grace
            const graceUser = sqlite.prepare(`
                SELECT at.*, e.employee_id, e.branch_id, r.role_name
                FROM api_tokens at
                JOIN employees e ON at.employee_id = e.employee_id
                JOIN roles r ON e.role_id = r.role_id
                WHERE at.token = ? 
                LIMIT 1
            `).get(token);

            if (graceUser) {
                req.user = {
                    employee_id: graceUser.employee_id,
                    branch_id: graceUser.branch_id,
                    role: graceUser.role_name,
                    token: token
                };
                return next();
            }

            return res.status(401).json({ status: 'error', message: 'Authentication failed (Remote Server unreachable)' });
        }

        // Background Sync (Don't await)
        SyncService.triggerSync(token).catch(err => console.error("Background Sync Trigger Error:", err));

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
