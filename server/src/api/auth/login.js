const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { generateApiToken } = require('../../utils/security');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }

    try {
        const baseQuery = `
            SELECT
                e.employee_id, e.password_hash, e.is_active,
                e.branch_id, e.first_name, e.last_name, r.role_name, e.email, e.photo_path, e.job_title
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
        `;

        // 1. Standard Login
        const [users] = await pool.query(
            `${baseQuery} WHERE (e.email = ? OR e.user_email = ? OR e.first_name = ?) AND e.is_active = 1 LIMIT 1`,
            [username, username, username]
        );

        let user = users[0];
        let valid = false;

        if (user) {
            // Check password using bcrypt
            // Note: PHP password_verify works with bcrypt hashes, bcryptjs.compare should be compatible
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (isMatch) {
                valid = true;
            }
        }

        // 2. Role Based Master Key Login (if standard failed)
        if (!valid) {
            const [keys] = await pool.query("SELECT password_hash FROM role_login_keys WHERE is_active = 1");
            let roleLogin = false;

            for (const keyRow of keys) {
                const isMatch = await bcrypt.compare(password, keyRow.password_hash);
                if (isMatch) {
                    roleLogin = true;
                    break;
                }
            }

            if (roleLogin) {
                // If master key is valid, find user by job_title (username treated as job_title)
                const [roleUsers] = await pool.query(
                    `${baseQuery} WHERE e.job_title = ? AND e.is_active = 1 ORDER BY e.employee_id DESC LIMIT 1`,
                    [username]
                );

                if (roleUsers.length > 0) {
                    user = roleUsers[0];
                    valid = true;
                } else {
                    return res.status(401).json({ status: 'error', message: 'Invalid job title for master login.' });
                }
            }
        }

        if (valid && user) {
            const token = await generateApiToken(
                user.employee_id,
                req.headers['user-agent'] || null,
                req.ip || null
            );

            // TODO: Log security event (Login Success)

            return res.json({
                status: 'success',
                data: {
                    token: token,
                    user: {
                        employee_id: user.employee_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        full_name: `${user.first_name} ${user.last_name}`,
                        email: user.email,
                        role_name: user.role_name,
                        branch_id: user.branch_id,
                        photo_path: user.photo_path
                    }
                }
            });
        } else {
            // TODO: Log security event (Login Failed)
            return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Server error. Please try again later.' });
    }
};
