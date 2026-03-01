const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

exports.getDashboardData = async (req, res) => {
    try {
        const branchId = req.user.branch_id || req.query.branch_id;
        if (!branchId) {
            return res.status(400).json({ status: "error", message: "Branch ID required" });
        }

        const getISTDate = (date) => {
            const offset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(date.getTime() + offset);
            return istDate.toISOString().split('T')[0];
        };

        const today = getISTDate(new Date());
        const istNow = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
        const startOfMonth = getISTDate(new Date(istNow.getFullYear(), istNow.getMonth(), 1));
        const endOfMonth = getISTDate(new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0));

        // Generate dates for the last 7 days for weekly stats
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

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
            // 1. Auto-activation: If marked present today, they must be active
            try {
                await pool.query(`
                    UPDATE patients 
                    SET status = 'active'
                    WHERE status != 'active' AND status != 'completed' AND status != 'terminated'
                      AND (branch_id = ? OR branch_id IS NULL OR branch_id = 0)
                      AND EXISTS (
                          SELECT 1 FROM attendance a 
                          WHERE a.patient_id = patients.patient_id 
                            AND DATE(a.attendance_date) = CURDATE()
                            AND a.status = 'present'
                      )
                `, [branchId]);
            } catch (e) {
                console.error("Auto-activation error:", e);
            }

            try {
                const sqlCleanup = `
                    UPDATE patients 
                    SET status = 'inactive'
                    WHERE branch_id = ? 
                      AND status = 'active'
                      AND (
                          (patient_id IN (
                              SELECT patient_id 
                              FROM attendance 
                              GROUP BY patient_id 
                              HAVING MAX(SUBSTR(attendance_date, 1, 10)) < DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                          ))
                          OR 
                          (NOT EXISTS (SELECT 1 FROM attendance a WHERE a.patient_id = patients.patient_id) 
                           AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
                      )`;
                await pool.query(sqlCleanup, [branchId]);

                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                fs.writeFileSync(cleanupFile, today);
            } catch (error) {
                console.error("Auto-deactivation failed:", error);
            }
        }

        // -------------------------------------------------------------------------
        // 1. REGISTRATION & INQUIRY CARD
        // -------------------------------------------------------------------------
        const regStats = {};

        // Execute all independent queries in parallel to minimize network latency
        const [
            [regTotalRows],
            [regStatusRows],
            [regMonthRows],
            [regApprovalRows],
            [quickRows],
            [testInqRows],
            [attendedRows],
            [totalPtsRows],
            [activeRows],
            [inactiveRows],
            [ptPaidRows],
            [newPtMonthRows],
            [testTodayRows],
            [testApprRows],
            [testPendRows],
            [testCompRows],
            [testRevRows],
            [testMonthRows],
            [regPayRows],
            [ptDueRows],
            [testDueRows],
            [monthRegPayRows],
            [monthTestPayRows],
            [monthPtPayRows],
            [schedule],
            [weeklyRows]
        ] = await Promise.all([
            // 1. regTotalRows
            pool.query("SELECT COUNT(*) as count FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ?", [branchId, today]),

            // 2. regStatusRows
            pool.query(`
                SELECT 
                    SUM(CASE WHEN status = 'pending' AND DATE(appointment_date) = ? THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN (status = 'consulted' OR status = 'closed') AND DATE(appointment_date) = ? THEN 1 ELSE 0 END) as conducted
                FROM registration
                WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0)
            `, [today, today, branchId]),

            // 3. regMonthRows
            pool.query("SELECT COUNT(*) as count FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]),

            // 4. regApprovalRows
            pool.query("SELECT COUNT(*) as count FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND approval_status = 'pending'", [branchId]),

            // 5. quickRows
            pool.query("SELECT COUNT(*) as count FROM quick_inquiry WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ?", [branchId, today]),

            // 6. testInqRows
            pool.query("SELECT COUNT(*) as count FROM test_inquiry WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ?", [branchId, today]),

            // 7. attendedRows
            pool.query(`
                SELECT COUNT(DISTINCT a.patient_id) as count 
                FROM attendance a
                JOIN patients p ON a.patient_id = p.patient_id
                WHERE DATE(a.attendance_date) = ? AND (p.branch_id = ? OR p.branch_id IS NULL OR p.branch_id = 0) AND a.status = 'present'
            `, [today, branchId]),

            // 8. totalPtsRows
            pool.query("SELECT COUNT(*) as count FROM patients WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0)", [branchId]),

            // 9. activeRows
            pool.query("SELECT COUNT(*) as count FROM patients WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND status = 'active'", [branchId]),

            // 10. inactiveRows
            pool.query("SELECT COUNT(*) as count FROM patients WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND status = 'inactive'", [branchId]),

            // 11. ptPaidRows
            pool.query(`
                SELECT SUM(p.amount) as total
                FROM payments p
                JOIN patients pt ON p.patient_id = pt.patient_id
                WHERE (pt.branch_id = ? OR pt.branch_id IS NULL OR pt.branch_id = 0) AND DATE(p.payment_date) = ?
            `, [branchId, today]),

            // 12. newPtMonthRows
            pool.query("SELECT COUNT(*) as count FROM patients WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]),

            // 13. testTodayRows
            pool.query("SELECT COUNT(*) as count FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ? AND approval_status != 'rejected'", [branchId, today]),

            // 14. testApprRows
            pool.query("SELECT COUNT(*) as count FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ? AND approval_status = 'pending'", [branchId, today]),

            // 15. testPendRows
            pool.query("SELECT COUNT(*) as count FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND test_status = 'pending' AND approval_status = 'approved' AND DATE(created_at) = ?", [branchId, today]),

            // 16. testCompRows
            pool.query("SELECT COUNT(*) as count FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND test_status = 'completed' AND approval_status = 'approved' AND DATE(created_at) = ?", [branchId, today]),

            // 17. testRevRows
            pool.query("SELECT SUM(advance_amount) as total FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(visit_date) = ? AND test_status != 'cancelled' AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]),

            // 18. testMonthRows
            pool.query("SELECT COUNT(*) as count FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) BETWEEN ? AND ? AND approval_status != 'rejected'", [branchId, startOfMonth, endOfMonth]),

            // 19. regPayRows
            pool.query("SELECT SUM(consultation_amount) as total FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ? AND status != 'closed' AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]),

            // 20. ptDueRows
            pool.query("SELECT SUM(due_amount) as total FROM patients WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ? AND treatment_type = 'package'", [branchId, today]),

            // 21. testDueRows
            pool.query("SELECT SUM(due_amount) as total FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) = ? AND approval_status != 'rejected' AND approval_status != 'pending'", [branchId, today]),

            // 22. monthRegPayRows
            pool.query("SELECT SUM(consultation_amount) as total FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(created_at) BETWEEN ? AND ? AND approval_status = 'approved'", [branchId, startOfMonth, endOfMonth]),

            // 23. monthTestPayRows
            pool.query("SELECT SUM(advance_amount) as total FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND DATE(visit_date) BETWEEN ? AND ? AND approval_status = 'approved'", [branchId, startOfMonth, endOfMonth]),

            // 24. monthPtPayRows
            pool.query("SELECT SUM(p.amount) as total FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE (pt.branch_id = ? OR pt.branch_id IS NULL OR pt.branch_id = 0) AND DATE(p.payment_date) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]),

            pool.query(`
                SELECT 
                    r.registration_id as id,
                    r.patient_name,
                    DATE(r.appointment_date) as appointment_date,
                    r.appointment_time,
                    r.status,
                    r.approval_status,
                    pm.patient_uid
                FROM registration r
                LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
                WHERE (r.branch_id = ? OR r.branch_id IS NULL OR r.branch_id = 0)
                  AND DATE(r.appointment_date) = ?
                  AND r.appointment_time IS NOT NULL
                  AND LOWER(r.status) NOT IN ('closed', 'cancelled')
                ORDER BY r.appointment_time ASC LIMIT 50
            `, [branchId, today]),

            // 26. weeklyRows
            pool.query(`
                SELECT 
                    DATE(d) as date,
                    SUM(amount) as total
                FROM (
                    SELECT created_at as d, consultation_amount as amount FROM registration WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND status != 'closed' AND approval_status != 'rejected' AND approval_status != 'pending'
                    UNION ALL
                    SELECT visit_date as d, advance_amount as amount FROM tests WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND test_status != 'cancelled' AND approval_status != 'rejected' AND approval_status != 'pending'
                    UNION ALL
                    SELECT payment_date as d, p.amount FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE (pt.branch_id = ? OR pt.branch_id IS NULL OR pt.branch_id = 0)
                ) as combined
                WHERE DATE(d) BETWEEN ? AND ?
                GROUP BY DATE(d)
                ORDER BY DATE(d) ASC
            `, [branchId, branchId, branchId, dates[0], dates[6]])
        ]);

        regStats.today_total = regTotalRows[0].count;
        regStats.pending = parseInt(regStatusRows[0].pending || 0);
        regStats.consulted = parseInt(regStatusRows[0].conducted || 0);
        regStats.month_total = regMonthRows[0].count;
        regStats.approval_pending = parseInt(regApprovalRows[0].count || 0);

        const inqStats = {};
        inqStats.quick = parseInt(quickRows[0].count || 0);
        inqStats.test = parseInt(testInqRows[0].count || 0);
        inqStats.total_today = inqStats.quick + inqStats.test;

        const patientStats = {};
        patientStats.today_attendance = attendedRows[0].count;
        patientStats.total_ever = totalPtsRows[0].count;
        patientStats.active = activeRows[0].count;
        patientStats.inactive = inactiveRows[0].count;
        patientStats.paid_today = parseFloat(ptPaidRows[0].total || 0);
        patientStats.new_month = newPtMonthRows[0].count;

        const testStats = {};
        testStats.today_total = testTodayRows[0].count;
        testStats.approval_pending = parseInt(testApprRows[0].count || 0);
        testStats.pending = parseInt(testPendRows[0].count || 0);
        testStats.completed = parseInt(testCompRows[0].count || 0);
        testStats.revenue_today = parseFloat(testRevRows[0].total || 0);
        testStats.total_month = testMonthRows[0].count;

        const collStats = {};
        collStats.reg_amount = parseFloat(regPayRows[0].total || 0);
        collStats.treatment_amount = patientStats.paid_today;
        collStats.test_amount = testStats.revenue_today;
        collStats.today_total = collStats.reg_amount + collStats.treatment_amount + collStats.test_amount;

        collStats.patient_dues = parseFloat(ptDueRows[0].total || 0);
        collStats.test_dues = parseFloat(testDueRows[0].total || 0);
        collStats.today_dues = collStats.patient_dues + collStats.test_dues;

        collStats.month_total = parseFloat(monthRegPayRows[0].total || 0) + parseFloat(monthTestPayRows[0].total || 0) + parseFloat(monthPtPayRows[0].total || 0);

        // Weekly processing remains the same

        const resultsMap = {};
        weeklyRows.forEach(row => {
            const dateObj = new Date(row.date);
            const dateStr = getISTDate(dateObj);
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
                systemStatus,
                serverTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
