const pool = require('../../config/db');

exports.checkUpdates = async (req, res) => {
    try {
        const branchId = req.user.branch_id || req.query.branch_id;
        const lastSync = req.query.last_sync; // ISO string

        if (!branchId || !lastSync) {
            return res.status(400).json({ success: false, message: "Branch ID and last_sync timestamp are required" });
        }

        // Convert ISO string to MySQL format (YYYY-MM-DD HH:MM:SS)
        const lastSyncDate = new Date(lastSync);
        const mysqlTimestamp = lastSyncDate.toISOString().slice(0, 19).replace('T', ' ');

        // Set session timezone to UTC to match Node.js toISOString comparison
        await pool.query("SET time_zone = '+00:00'");

        const tables = [
            'registration',
            'tests',
            'patients',
            'quick_inquiry',
            'test_inquiry',
            'attendance',
            'payments',
            'notifications'
        ];

        let hasChanges = false;
        const changes = {};

        // For each table, check if any record was created or updated after mysqlTimestamp
        // We'll use branch_id where applicable.

        // registration, tests, patients, quick_inquiry, test_inquiry, attendance, payments are linked to branch_id
        // notifications are linked to employee_id (but we can check if any relevant notification appeared)

        for (const table of tables) {
            let query = '';
            let params = [];

            if (table === 'notifications') {
                const employeeId = req.user.employee_id || req.query.employee_id;
                if (!employeeId) continue;
                query = `SELECT COUNT(*) as count FROM ${table} WHERE employee_id = ? AND created_at > ?`;
                params = [employeeId, mysqlTimestamp];
            } else {
                // Determine the correct branch_id column and timestamp columns.
                if (table === 'attendance') {
                    query = `SELECT COUNT(*) as count FROM attendance a JOIN patients p ON a.patient_id = p.patient_id WHERE p.branch_id = ? AND (a.created_at > ? OR a.approved_at > ?)`;
                    params = [branchId, mysqlTimestamp, mysqlTimestamp];
                } else if (table === 'payments') {
                    // payments table has branch_id directly, checked in previous steps
                    query = `SELECT COUNT(*) as count FROM payments WHERE branch_id = ? AND created_at > ?`;
                    params = [branchId, mysqlTimestamp];
                } else {
                    const hasUpdatedAt = ['registration', 'tests', 'patients'].includes(table);
                    const updateCheck = hasUpdatedAt ? ` OR updated_at > ?` : '';
                    query = `SELECT COUNT(*) as count FROM ${table} WHERE branch_id = ? AND (created_at > ?${updateCheck})`;
                    params = [branchId, mysqlTimestamp];
                    if (hasUpdatedAt) params.push(mysqlTimestamp);
                }
            }

            const [rows] = await pool.query(query, params);
            if (rows[0].count > 0) {
                hasChanges = true;
                changes[table] = rows[0].count;
            }
        }

        res.json({
            success: true,
            hasChanges,
            changes,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        console.error("Check Updates Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
