const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

exports.getDashboardData = async (req, res) => {
    try {
        const branchId = req.user.branch_id || req.query.branch_id;
        if (!branchId) {
            return res.status(400).json({ status: "error", message: "Branch ID required" });
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // -------------------------------------------------------------------------
        // AUTO-DEACTIVATION LOGIC
        // -------------------------------------------------------------------------
        const tmpDir = path.join(__dirname, '../../../tmp');
        const cleanupFile = path.join(tmpDir, `last_cleanup_${branchId}.txt`);

        let lastRunDate = '';
        if (fs.existsSync(cleanupFile)) {
            lastRunDate = fs.readFileSync(cleanupFile, 'utf8').trim();
        }

        if (lastRunDate !== today) {
            const sqlCleanup = `
                UPDATE patients p
                LEFT JOIN (
                    SELECT patient_id, MAX(attendance_date) as last_visit 
                    FROM attendance 
                    GROUP BY patient_id
                ) a ON p.patient_id = a.patient_id
                SET p.status = 'inactive'
                WHERE p.branch_id = ? 
                  AND p.status = 'active'
                  AND (
                      (a.last_visit IS NOT NULL AND a.last_visit < DATE_SUB(CURDATE(), INTERVAL 3 DAY))
                      OR 
                      (a.last_visit IS NULL AND p.created_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
                  )`;
            await pool.query(sqlCleanup, [branchId]);

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            fs.writeFileSync(cleanupFile, today);
        }

        // -------------------------------------------------------------------------
        // 1. REGISTRATION & INQUIRY CARD
        // -------------------------------------------------------------------------
        const regStats = {};

        const [regTotalRows] = await pool.query("SELECT COUNT(*) as count FROM registration WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        regStats.today_total = regTotalRows[0].count;

        const [regStatusRows] = await pool.query(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status IN ('consulted','closed') THEN 1 ELSE 0 END) as conducted
            FROM registration
            WHERE branch_id = ? AND DATE(appointment_date) = ?
        `, [branchId, today]);
        regStats.pending = parseInt(regStatusRows[0].pending || 0);
        regStats.consulted = parseInt(regStatusRows[0].conducted || 0);

        const [regMonthRows] = await pool.query("SELECT COUNT(*) as count FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);
        regStats.month_total = regMonthRows[0].count;

        const [regApprovalRows] = await pool.query("SELECT COUNT(*) as count FROM registration WHERE branch_id = ? AND approval_status = 'pending'", [branchId]);
        regStats.approval_pending = parseInt(regApprovalRows[0].count || 0);

        const inqStats = {};
        const [quickRows] = await pool.query("SELECT COUNT(*) as count FROM quick_inquiry WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        inqStats.quick = parseInt(quickRows[0].count || 0);

        const [testInqRows] = await pool.query("SELECT COUNT(*) as count FROM test_inquiry WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        inqStats.test = parseInt(testInqRows[0].count || 0);
        inqStats.total_today = inqStats.quick + inqStats.test;

        // -------------------------------------------------------------------------
        // 2. ONGOING PATIENTS CARD
        // -------------------------------------------------------------------------
        const patientStats = {};

        const [attendedRows] = await pool.query(`
            SELECT COUNT(DISTINCT a.patient_id) as count 
            FROM attendance a
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.attendance_date = ? AND p.branch_id = ?
        `, [today, branchId]);
        patientStats.today_attendance = attendedRows[0].count;

        const [totalPtsRows] = await pool.query("SELECT COUNT(*) as count FROM patients WHERE branch_id = ?", [branchId]);
        patientStats.total_ever = totalPtsRows[0].count;

        const [activeRows] = await pool.query("SELECT COUNT(*) as count FROM patients WHERE branch_id = ? AND status = 'active'", [branchId]);
        patientStats.active = activeRows[0].count;

        const [inactiveRows] = await pool.query("SELECT COUNT(*) as count FROM patients WHERE branch_id = ? AND status = 'inactive'", [branchId]);
        patientStats.inactive = inactiveRows[0].count;

        const [ptPaidRows] = await pool.query(`
            SELECT SUM(p.amount) as total
            FROM payments p
            JOIN patients pt ON p.patient_id = pt.patient_id
            WHERE pt.branch_id = ? AND p.payment_date = ?
        `, [branchId, today]);
        patientStats.paid_today = parseFloat(ptPaidRows[0].total || 0);

        const [newPtMonthRows] = await pool.query("SELECT COUNT(*) as count FROM patients WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);
        patientStats.new_month = newPtMonthRows[0].count;

        // -------------------------------------------------------------------------
        // 3. TESTS CARD
        // -------------------------------------------------------------------------
        const testStats = {};

        const [testTodayRows] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND DATE(created_at) = ? AND approval_status != 'rejected'", [branchId, today]);
        testStats.today_total = testTodayRows[0].count;

        const [testApprRows] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND DATE(created_at) = ? AND approval_status = 'pending'", [branchId, today]);
        testStats.approval_pending = parseInt(testApprRows[0].count || 0);

        const [testPendRows] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND test_status = 'pending' AND approval_status = 'approved' AND DATE(created_at) = ?", [branchId, today]);
        testStats.pending = parseInt(testPendRows[0].count || 0);

        const [testCompRows] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND test_status = 'completed' AND approval_status = 'approved' AND DATE(created_at) = ?", [branchId, today]);
        testStats.completed = parseInt(testCompRows[0].count || 0);

        const [testRevRows] = await pool.query("SELECT SUM(advance_amount) as total FROM tests WHERE branch_id = ? AND DATE(visit_date) = ? AND test_status != 'cancelled' AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]);
        testStats.revenue_today = parseFloat(testRevRows[0].total || 0);

        const [testMonthRows] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ? AND approval_status != 'rejected'", [branchId, startOfMonth, endOfMonth]);
        testStats.total_month = testMonthRows[0].count;

        // -------------------------------------------------------------------------
        // 4. COLLECTIONS CARD
        // -------------------------------------------------------------------------
        const collStats = {};

        const [regPayRows] = await pool.query("SELECT SUM(consultation_amount) as total FROM registration WHERE branch_id = ? AND DATE(created_at) = ? AND status != 'closed' AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]);
        collStats.reg_amount = parseFloat(regPayRows[0].total || 0);
        collStats.treatment_amount = patientStats.paid_today;
        collStats.test_amount = testStats.revenue_today;
        collStats.today_total = collStats.reg_amount + collStats.treatment_amount + collStats.test_amount;

        const [ptDueRows] = await pool.query("SELECT SUM(due_amount) as total FROM patients WHERE branch_id = ? AND DATE(created_at) = ? AND treatment_type = 'package'", [branchId, today]);
        collStats.patient_dues = parseFloat(ptDueRows[0].total || 0);

        const [testDueRows] = await pool.query("SELECT SUM(due_amount) as total FROM tests WHERE branch_id = ? AND DATE(created_at) = ? AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]);
        collStats.test_dues = parseFloat(testDueRows[0].total || 0);
        collStats.today_dues = collStats.patient_dues + collStats.test_dues;

        const [monthRegPayRows] = await pool.query("SELECT SUM(consultation_amount) as total FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ? AND approval_status = 'approved'", [branchId, startOfMonth, endOfMonth]);
        const [monthTestPayRows] = await pool.query("SELECT SUM(advance_amount) as total FROM tests WHERE branch_id = ? AND DATE(visit_date) BETWEEN ? AND ? AND approval_status = 'approved'", [branchId, startOfMonth, endOfMonth]);
        const [monthPtPayRows] = await pool.query("SELECT SUM(p.amount) as total FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ? AND p.payment_date BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);

        collStats.month_total = parseFloat(monthRegPayRows[0].total || 0) + parseFloat(monthTestPayRows[0].total || 0) + parseFloat(monthPtPayRows[0].total || 0);

        // -------------------------------------------------------------------------
        // 5. SCHEDULE
        // -------------------------------------------------------------------------
        const [schedule] = await pool.query(`
            SELECT 
                registration_id as id, 
                patient_name, 
                appointment_time, 
                status,
                approval_status 
            FROM registration 
            WHERE branch_id = ? AND DATE(appointment_date) = ?
            ORDER BY appointment_time ASC LIMIT 50
        `, [branchId, today]);

        // -------------------------------------------------------------------------
        // 6. WEEKLY ANALYTICS
        // -------------------------------------------------------------------------
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const [weeklyRows] = await pool.query(`
            SELECT 
                DATE(d) as date,
                SUM(amount) as total
            FROM (
                SELECT created_at as d, consultation_amount as amount FROM registration WHERE branch_id = ? AND status != 'closed' AND approval_status != 'rejected' AND approval_status != 'pending'
                UNION ALL
                SELECT visit_date as d, advance_amount as amount FROM tests WHERE branch_id = ? AND test_status != 'cancelled' AND approval_status != 'rejected' AND approval_status != 'pending'
                UNION ALL
                SELECT payment_date as d, p.amount FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ?
            ) as combined
            WHERE DATE(d) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
            GROUP BY DATE(d)
        `, [branchId, branchId, branchId]);

        const resultsMap = {};
        weeklyRows.forEach(row => {
            const dateStr = new Date(row.date).toISOString().split('T')[0];
            resultsMap[dateStr] = row.total;
        });

        const weeklyStats = dates.map(date => {
            const d = new Date(date);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            return {
                date,
                day: dayName,
                total: parseFloat(resultsMap[date] || 0)
            };
        });

        // -------------------------------------------------------------------------
        // 7. SYSTEM STATUS
        // -------------------------------------------------------------------------
        const systemStatus = {
            maintenance: true,
            updateBanner: {
                show: true,
                message: "Routine system maintenance scheduled for 10:00 PM tonight."
            },
            latestVersion: "2.5.0"
        };

        res.json({
            status: "success",
            data: {
                registration: regStats,
                inquiry: inqStats,
                patients: patientStats,
                tests: testStats,
                collections: collStats,
                schedule,
                weekly: weeklyStats,
                systemStatus
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
