const pool = require('../../config/db');

exports.getDashboardData = async (req, res) => {
    const branchId = req.user.branch_id || req.query.branch_id;
    if (!branchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });

    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    const thirtyDaysAgoObj = new Date();
    thirtyDaysAgoObj.setDate(thirtyDaysAgoObj.getDate() - 30);
    const thirtyDaysAgo = thirtyDaysAgoObj.toISOString().split('T')[0];

    try {
        // 1. KPI Metrics
        const [[{ count: regToday }]] = await pool.query("SELECT COUNT(*) as count FROM registration WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        const [regMonthBreakdown] = await pool.query("SELECT status, COUNT(*) as count FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ? GROUP BY status", [branchId, startOfMonth, endOfMonth]);
        const [[{ total: regTodayRevenue }]] = await pool.query("SELECT COALESCE(SUM(consultation_amount), 0) as total FROM registration WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);

        const [[{ count: patTodayNew }]] = await pool.query("SELECT COUNT(*) as count FROM patients WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        const [patStatusBreakdown] = await pool.query("SELECT status, COUNT(*) as count FROM patients WHERE branch_id = ? GROUP BY status", [branchId]);
        const [[{ total: patTodayRevenue }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ? AND DATE(p.payment_date) = ?", [branchId, today]);

        const [[{ count: testToday }]] = await pool.query("SELECT COUNT(*) as count FROM tests WHERE branch_id = ? AND DATE(created_at) = ?", [branchId, today]);
        const [[{ total: testTodayRevenue }]] = await pool.query("SELECT COALESCE(SUM(advance_amount), 0) as total FROM tests WHERE branch_id = ? AND DATE(visit_date) = ?", [branchId, today]);

        const [[{ total: expTodayAmount }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE branch_id = ? AND expense_date = ?", [branchId, today]);

        const [[expMonth]] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN r.role_name IN ('admin', 'superadmin') THEN e.amount ELSE 0 END), 0) as admin_total,
                COALESCE(SUM(CASE WHEN r.role_name NOT IN ('admin', 'superadmin') THEN e.amount ELSE 0 END), 0) as reception_total
            FROM expenses e
            LEFT JOIN employees emp ON e.user_id = emp.employee_id
            LEFT JOIN roles r ON emp.role_id = r.role_id
            WHERE e.branch_id = ? AND e.expense_date BETWEEN ? AND ?
        `, [branchId, startOfMonth, endOfMonth]);

        // Revenue Aggregation
        const todayRevenue = parseFloat(regTodayRevenue) + parseFloat(patTodayRevenue) + parseFloat(testTodayRevenue);

        const [[{ total: regMonthRevenue }]] = await pool.query("SELECT COALESCE(SUM(consultation_amount), 0) as total FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);
        const [[{ total: patMonthRevenue }]] = await pool.query("SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ? AND p.payment_date BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);
        const [[{ total: testMonthRevenue }]] = await pool.query("SELECT COALESCE(SUM(advance_amount), 0) as total FROM tests WHERE branch_id = ? AND DATE(visit_date) BETWEEN ? AND ?", [branchId, startOfMonth, endOfMonth]);

        const monthRevenue = parseFloat(regMonthRevenue) + parseFloat(patMonthRevenue) + parseFloat(testMonthRevenue);

        // 2. Charts Data
        // Daily Revenue vs Expense (Last 30 Days)
        // In Node, generating the date series without helper tables can be done via code or a complex query.
        // Let's use the code approach to keep SQL cleaner if possible, or use the UNION ALL trick if needed.
        // Given complexity of UNION ALL for 30 days, I'll use a slightly more compact SQL approach if it works.
        const [financeChart] = await pool.query(`
            WITH RECURSIVE dates AS (
                SELECT ? AS d
                UNION ALL
                SELECT DATE_ADD(d, INTERVAL 1 DAY) FROM dates WHERE d < ?
            )
            SELECT 
                dates.d as day,
                COALESCE(rev.total, 0) as revenue,
                COALESCE(exp.total, 0) as expense
            FROM dates
            LEFT JOIN (
                SELECT DATE(d) as day, SUM(amt) as total FROM (
                    SELECT created_at as d, consultation_amount as amt FROM registration WHERE branch_id = ?
                    UNION ALL
                    SELECT payment_date as d, amount as amt FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ?
                    UNION ALL
                    SELECT visit_date as d, advance_amount as amt FROM tests WHERE branch_id = ?
                ) combined GROUP BY day
            ) rev ON dates.d = rev.day
            LEFT JOIN (
                SELECT expense_date as day, SUM(amount) as total FROM expenses WHERE branch_id = ? GROUP BY day
            ) exp ON dates.d = exp.day
            ORDER BY day ASC
        `, [thirtyDaysAgo, today, branchId, branchId, branchId, branchId]);

        // Treatment Popularity
        const [treatments] = await pool.query(`
            SELECT treatment_type, COUNT(*) as count 
            FROM patients 
            WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?
            GROUP BY treatment_type
        `, [branchId, startOfMonth, endOfMonth]);

        // Recent Activity
        const [activity] = await pool.query(`
            SELECT username, action_type, target_table, target_id, log_timestamp 
            FROM audit_log 
            WHERE branch_id = ? 
            ORDER BY log_timestamp DESC 
            LIMIT 15
        `, [branchId]);

        res.json({
            status: 'success',
            data: {
                metrics: {
                    today_revenue: todayRevenue,
                    month_revenue: monthRevenue,
                    today_registrations: regToday,
                    today_new_patients: patTodayNew,
                    today_tests: testToday,
                    today_expenses: parseFloat(expTodayAmount),
                    month_expenses: parseFloat(expMonth.admin_total) + parseFloat(expMonth.reception_total)
                },
                breakdowns: {
                    registration_month: regMonthBreakdown,
                    patient_status: patStatusBreakdown,
                    expense_month: expMonth
                },
                charts: {
                    finance: financeChart,
                    treatments: treatments
                },
                activity: activity
            }
        });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
