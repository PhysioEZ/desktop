const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const sqlite = require('../../config/sqlite');
const { generateApiToken } = require('../../utils/security');

/**
 * RESTORED ORIGINAL LOGIN LOGIC
 * Now using the Bridge Proxy in db.js to talk to Remote MySQL via HTTP.
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }

    try {
        // 0. CHECK SYSTEM STATUS
        const [settingsRows] = await pool.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('maintenance_mode', 'force_logout')");
        const settings = {};
        settingsRows.forEach(row => settings[row.setting_key] = row.setting_value);

        if (settings.maintenance_mode === '1') {
            return res.status(403).json({
                status: 'error',
                message: 'System is under maintenance.'
            });
        }

        const baseQuery = `
            SELECT
                e.employee_id, e.password_hash, e.is_active, e.role_id,
                e.branch_id, e.first_name, e.last_name, r.role_name, e.email, e.photo_path, e.job_title
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
        `;

        // 1. Standard Login (Restored first_name check)
        const [users] = await pool.query(
            `${baseQuery} WHERE (e.email = ? OR e.user_email = ? OR e.first_name = ?) AND e.is_active = 1 LIMIT 1`,
            [username, username, username]
        );

        let user = users[0];
        let valid = false;

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (isMatch) valid = true;
        }

        // 2. Master Key Fallback (Restored original logic)
        if (!valid) {
            const [keys] = await pool.query("SELECT password_hash FROM role_login_keys WHERE is_active = 1");
            let roleLoginValid = false;

            for (const keyRow of keys) {
                if (await bcrypt.compare(password, keyRow.password_hash)) {
                    roleLoginValid = true;
                    break;
                }
            }

            if (roleLoginValid) {
                // Find by job_title
                const [roleUsers] = await pool.query(
                    `${baseQuery} WHERE e.job_title = ? AND e.is_active = 1 ORDER BY e.employee_id DESC LIMIT 1`,
                    [username]
                );
                if (roleUsers.length > 0) {
                    user = roleUsers[0];
                    valid = true;
                }
            }
        }

        if (valid && user) {
            const token = await generateApiToken(
                user.employee_id,
                req.headers['user-agent'] || null,
                req.ip || null
            );

            // SYNC TO LOCAL CACHE IMMEDIATELY
            // This prevents the next request from failing if the bridge is slow
            try {
                sqlite.prepare(`
                    INSERT INTO roles (role_id, role_name) VALUES (?, ?)
                    ON CONFLICT(role_id) DO UPDATE SET role_name=excluded.role_name
                `).run(user.role_id, user.role_name);

                sqlite.prepare(`
                    INSERT INTO employees (employee_id, branch_id, role_id, first_name, last_name, email, is_active, job_title, photo_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(employee_id) DO UPDATE SET
                        branch_id=excluded.branch_id, role_id=excluded.role_id,
                        first_name=excluded.first_name, last_name=excluded.last_name
                `).run(user.employee_id, user.branch_id, user.role_id, user.first_name, user.last_name, user.email, user.is_active, user.job_title || null, user.photo_path || null);


                sqlite.prepare(`
                    INSERT INTO api_tokens (token, employee_id, _last_synced_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(token) DO UPDATE SET _last_synced_at=CURRENT_TIMESTAMP
                `).run(token, user.employee_id);
            } catch (cacheErr) {
                // Log but don't break the login flow if local cache sync fails
                console.error("Local Login Sync Error:", cacheErr.message);
            }

            return res.json({
                status: 'success',
                data: {
                    token: token,
                    user: {
                        employee_id: user.employee_id,
                        full_name: `${user.first_name} ${user.last_name}`,
                        email: user.email,
                        role_name: user.role_name,
                        branch_id: user.branch_id,
                        photo_path: user.photo_path
                    }
                }
            });
        }

        return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Server error: ' + error.message });
    }
};
