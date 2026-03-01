const pool = require("../../config/db");

exports.handleBillingRequest = async (req, res) => {
    const action = req.body.action || req.query.action || "fetch_overview";
    const branchId = req.user.branch_id || req.query.branch_id;

    if (!branchId) {
        return res.status(400).json({ status: "error", message: "Branch ID required" });
    }

    try {
        switch (action) {
            case "fetch_overview":
                await fetchBillingOverview(req, res, branchId);
                break;
            case "fetch_combined_overview":
                await fetchCombinedOverview(req, res, branchId);
                break;
            case "fetch_test_payments":
                await fetchTestPayments(req, res, branchId);
                break;
            case "fetch_grouped_tests":
                await fetchGroupedTests(req, res, branchId);
                break;
            default:
                res.status(400).json({ status: "error", message: "Invalid action" });
        }
    } catch (error) {
        console.error("Billing Controller Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

async function fetchBillingOverview(req, res, branchId) {
    const { startDate, endDate, search, status, paymentFilter } = req.body; // paymentFilter: 'today', 'all'

    // Defaults
    const start = startDate ? `${startDate} 00:00:00` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const end = endDate ? `${endDate} 23:59:59` : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 19).replace('T', ' ');

    // A. Today's Collection (Cash in hand today, regardless of date range)
    // We use the Node server's current date string to be resilient to timezone mismatches with MySQL CURDATE()
    const todayStr = new Date().toISOString().split('T')[0];
    const [todayRows] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND (DATE(payment_date) = ? OR DATE(created_at) = ?)
    `, [branchId, todayStr, todayStr]);
    const todayCollection = todayRows[0].total;

    // B. Stats for the selected Range

    // B1. Range Billed: Total bill generated for patients registered in this period
    const [billedRows] = await pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(discount_amount), 0) as total_discount
        FROM patients 
        WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND created_at BETWEEN ? AND ?
    `, [branchId, start, end]);
    const rangeBilled = billedRows[0].total;
    const rangeDiscount = billedRows[0].total_discount;

    // B2. Range Paid: TOTAL CASH COLLECTED in this period (Regardless of registration date)
    const [paidRows] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND payment_date BETWEEN ? AND ?
    `, [branchId, start, end]);
    const rangePaid = paidRows[0].total;

    const rangeDue = Math.max(0, rangeBilled - rangePaid - rangeDiscount);

    // C. Payment Method Breakdown (For charts)
    const [methodRows] = await pool.query(`
        SELECT mode as payment_method, SUM(amount) as total
        FROM payments
        WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND payment_date BETWEEN ? AND ?
        GROUP BY mode
    `, [branchId, start, end]);

    // D. Collection Trends (Last 7 days)
    const [dbTrendRows] = await pool.query(`
        SELECT DATE(payment_date) as date, SUM(amount) as total
        FROM payments
        WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(payment_date)
    `, [branchId]);

    // Fill gaps for last 7 days
    const trends = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const match = dbTrendRows.find(row => {
            // MySQL DATE() returns YYYY-MM-DD but depending on driver it might be a Date object
            const rowDate = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
            return rowDate === dateStr;
        });

        trends.push({
            date: dateStr,
            total: match ? match.total : 0
        });
    }

    // Query to fetch grid data (Patients)
    // Modified to show patients who registered in this range OR made a payment in this range
    let whereSql = `(p.branch_id = ? OR p.branch_id IS NULL OR p.branch_id = 0) AND (
        p.created_at BETWEEN ? AND ? 
        OR EXISTS (SELECT 1 FROM payments pay WHERE pay.patient_id = p.patient_id AND pay.payment_date BETWEEN ? AND ?)
    )`;
    let params = [branchId, start, end, start, end];

    if (search) {
        whereSql += " AND (r.patient_name LIKE ? OR p.patient_id LIKE ? OR r.phone_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
        whereSql += " AND p.status = ?";
        params.push(status);
    }

    // specific filter for "Paid Today" toggle
    if (paymentFilter === 'today') {
        whereSql += " AND EXISTS (SELECT 1 FROM payments pay WHERE pay.patient_id = p.patient_id AND DATE(pay.payment_date) = CURDATE())";
    }

    const query = `
        SELECT 
            p.patient_id, p.status, p.total_amount, p.advance_payment, p.discount_amount, p.due_amount,
            p.created_at, p.service_track_id, p.treatment_type, p.treatment_days, p.package_cost, p.treatment_cost_per_day,
            r.patient_name, r.phone_number,
            COALESCE(pay.total_paid, 0) as total_paid,
            (
                SELECT MAX(created_at)
                FROM payments
                WHERE patient_id = p.patient_id
            ) as last_payment_date,
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE patient_id = p.patient_id AND DATE(payment_date) = CURDATE()
            ) as has_payment_today,
            COALESCE(hist.total_history_consumed, 0) as total_history_consumed,
            COALESCE(cur_att.count, 0) as attendance_count,
            (CASE 
                WHEN p.treatment_type = 'package' AND p.treatment_days > 0 THEN CAST(p.package_cost AS DECIMAL(10,2)) / p.treatment_days 
                ELSE p.treatment_cost_per_day 
            END) as cost_per_day
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN (
            SELECT patient_id, SUM(amount) as total_paid FROM payments GROUP BY patient_id
        ) pay ON p.patient_id = pay.patient_id
        LEFT JOIN (
            SELECT patient_id, SUM(consumed_amount) as total_history_consumed FROM patients_treatment GROUP BY patient_id
        ) hist ON p.patient_id = hist.patient_id
        LEFT JOIN (
            SELECT a.patient_id, COUNT(*) as count 
            FROM attendance a 
            JOIN patients p2 ON a.patient_id = p2.patient_id
            WHERE a.attendance_date >= COALESCE(p2.start_date, '2000-01-01') AND a.status = 'present'
            GROUP BY a.patient_id
        ) cur_att ON p.patient_id = cur_att.patient_id
        WHERE ${whereSql}
        ORDER BY p.created_at DESC
    `;

    const [patients] = await pool.query(query, params);

    // Calculate effective balance in JS for consistency
    patients.forEach(p => {
        const curConsumed = (p.attendance_count || 0) * (parseFloat(p.cost_per_day) || 0);
        p.total_paid = parseFloat(p.total_paid) || 0;
        p.total_history_consumed = parseFloat(p.total_history_consumed) || 0;
        p.effective_balance = p.total_paid - (p.total_history_consumed + curConsumed);
    });

    // Calculate aggregations for the cards based on the FILTERED selection ? 
    // Usually dashboard cards show global stats for the period, and table shows details.
    // Legacy shows "Billed (Range)" which is sum of all patients in that range.

    res.json({
        status: "success",
        data: {
            stats: {
                today_collection: todayCollection,
                range_billed: rangeBilled,
                range_paid: rangePaid,
                range_due: rangeDue,
                methods: methodRows,
                trends: trends
            },
            records: patients
        }
    });
}

async function fetchTestPayments(req, res, branchId) {
    const { startDate, endDate, search } = req.body;

    const start = startDate ? `${startDate} 00:00:00` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const end = endDate ? `${endDate} 23:59:59` : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 19).replace('T', ' ');

    try {
        let whereSql = `(t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND tp.created_at BETWEEN ? AND ?`;
        let params = [branchId, start, end];

        if (search) {
            whereSql += " AND (t.patient_name LIKE ? OR t.test_uid LIKE ? OR t.phone_number LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const query = `
            SELECT 
                tp.id as payment_id,
                tp.test_id,
                tp.amount,
                tp.payment_method,
                tp.created_at as payment_date,
                t.test_uid,
                t.patient_name,
                t.phone_number,
                t.test_name,
                t.patient_id
            FROM test_payments tp
            JOIN tests t ON tp.test_id = t.test_id
            WHERE ${whereSql}
            ORDER BY tp.created_at DESC
        `;

        const [rows] = await pool.query(query, params);

        res.json({
            status: "success",
            data: rows
        });
    } catch (error) {
        console.error("fetchTestPayments Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
}

async function fetchCombinedOverview(req, res, branchId) {
    const { startDate, endDate, search } = req.body;
    const start = startDate ? `${startDate} 00:00:00` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const end = endDate ? `${endDate} 23:59:59` : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 19).replace('T', ' ');

    try {
        // Range Stats (Separated)
        const [treatmentStats] = await pool.query(`
            SELECT 
                COALESCE(SUM(p.total_amount), 0) as billed,
                COALESCE(SUM(p.total_amount - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = p.patient_id) - COALESCE(p.discount_amount, 0)), 0) as due
            FROM patients p
            WHERE (p.branch_id = ? OR p.branch_id IS NULL OR p.branch_id = 0) AND p.created_at BETWEEN ? AND ?
        `, [branchId, start, end]);

        const [treatmentPaid] = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as paid 
            FROM payments 
            WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND payment_date BETWEEN ? AND ?
        `, [branchId, start, end]);

        const [testStats] = await pool.query(`
            SELECT 
                COALESCE(SUM(t.total_amount), 0) as billed,
                COALESCE(SUM(t.due_amount), 0) as due
            FROM tests t
            WHERE (t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND (t.created_at BETWEEN ? AND ? OR t.updated_at BETWEEN ? AND ?) AND t.test_status != 'cancelled'
        `, [branchId, start, end, start, end]);

        const [testPaid] = await pool.query(`
            SELECT COALESCE(SUM(tp.amount), 0) as paid 
            FROM test_payments tp
            JOIN tests t ON tp.test_id = t.test_id
            WHERE (t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND tp.created_at BETWEEN ? AND ?
        `, [branchId, start, end]);

        const today = new Date().toISOString().slice(0, 10);
        const [todayCollection] = await pool.query(`
            SELECT 
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE (branch_id = ? OR branch_id IS NULL OR branch_id = 0) AND payment_date BETWEEN ? AND ?) +
                (SELECT COALESCE(SUM(tp.amount), 0) FROM test_payments tp JOIN tests t ON tp.test_id = t.test_id WHERE (t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND tp.created_at BETWEEN ? AND ?) as total
        `, [branchId, `${today} 00:00:00`, `${today} 23:59:59`, branchId, `${today} 00:00:00`, `${today} 23:59:59`]);

        const stats = {
            treatment: {
                billed: parseFloat(treatmentStats[0].billed),
                paid: parseFloat(treatmentPaid[0].paid),
                due: parseFloat(treatmentStats[0].due)
            },
            tests: {
                billed: parseFloat(testStats[0].billed),
                paid: parseFloat(testPaid[0].paid),
                due: parseFloat(testStats[0].due)
            },
            today_collection: parseFloat(todayCollection[0].total)
        };

        // Fetch Records (Treatments)
        let treatmentSql = `
            SELECT 
                p.patient_id, r.patient_name, r.phone_number, 'treatment' as billing_type,
                p.total_amount as billed_amount, 
                p.discount_amount as discount,
                COALESCE((SELECT SUM(amount) FROM payments WHERE patient_id = p.patient_id AND payment_date BETWEEN ? AND ?), 0) as paid_amount,
                GREATEST(p.created_at, COALESCE((SELECT MAX(payment_date) FROM payments WHERE patient_id = p.patient_id), p.created_at)) as last_activity
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE (p.branch_id = ? OR p.branch_id IS NULL OR p.branch_id = 0) AND (
                p.created_at BETWEEN ? AND ? 
                OR EXISTS (SELECT 1 FROM payments WHERE patient_id = p.patient_id AND payment_date BETWEEN ? AND ?)
            )
        `;
        let treatmentParams = [start, end, branchId, start, end, start, end];
        if (search) {
            treatmentSql += " AND (r.patient_name LIKE ? OR r.phone_number LIKE ?)";
            treatmentParams.push(`%${search}%`, `%${search}%`);
        }

        // Fetch Records (Grouped Tests)
        let testSql = `
            SELECT 
                t.patient_id, t.patient_name, t.phone_number, 'test' as billing_type,
                SUM(t.total_amount) as billed_amount, 
                SUM(t.discount) as discount,
                SUM(COALESCE((SELECT SUM(amount) FROM test_payments WHERE test_id = t.test_id AND created_at BETWEEN ? AND ?), 0)) as paid_amount,
                GREATEST(t.created_at, t.updated_at, COALESCE((SELECT MAX(created_at) FROM test_payments WHERE test_id = t.test_id), t.created_at)) as last_activity,
                CASE WHEN t.patient_id IS NOT NULL AND t.patient_id > 0 THEN 1 ELSE 0 END as is_registered
            FROM tests t
            WHERE (t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND (
                t.created_at BETWEEN ? AND ? 
                OR t.updated_at BETWEEN ? AND ?
                OR EXISTS (SELECT 1 FROM test_payments WHERE test_id = t.test_id AND created_at BETWEEN ? AND ?)
            ) AND t.test_status != 'cancelled'
        `;
        let testParams = [start, end, branchId, start, end, start, end, start, end];
        if (search) {
            testSql += " AND (t.patient_name LIKE ? OR t.phone_number LIKE ?)";
            testParams.push(`%${search}%`, `%${search}%`);
        }
        testSql += " GROUP BY COALESCE(t.patient_id, t.patient_name || t.phone_number)";

        const [tRecords] = await pool.query(treatmentSql, treatmentParams);
        const [testRecords] = await pool.query(testSql, testParams);

        const mergedRecords = [...tRecords, ...testRecords].sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

        res.json({
            status: "success",
            data: {
                stats,
                records: mergedRecords
            }
        });
    } catch (e) {
        console.error("fetchCombinedOverview Error:", e);
        res.status(500).json({ status: "error", message: e.message });
    }
}

async function fetchGroupedTests(req, res, branchId) {
    const { startDate, endDate, search } = req.body;
    const start = startDate ? `${startDate} 00:00:00` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const end = endDate ? `${endDate} 23:59:59` : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 19).replace('T', ' ');

    try {
        let whereSql = `(t.branch_id = ? OR t.branch_id IS NULL OR t.branch_id = 0) AND t.created_at BETWEEN ? AND ? AND t.test_status != 'cancelled'`;
        let params = [branchId, start, end];

        if (search) {
            whereSql += " AND (t.patient_name LIKE ? OR t.phone_number LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        // Group by person. We'll use patient_id if available, otherwise patient_name + phone_number
        const query = `
            SELECT 
                t.patient_id, t.patient_name, t.phone_number,
                COUNT(t.test_id) as test_count,
                SUM(t.total_amount) as total_billed,
                SUM(t.advance_amount) as total_paid,
                SUM(t.due_amount) as total_due,
                MAX(t.created_at) as last_test_date
            FROM tests t
            WHERE ${whereSql}
            GROUP BY COALESCE(t.patient_id, t.patient_name || t.phone_number)
            ORDER BY last_test_date DESC
        `;

        const [rows] = await pool.query(query, params);

        res.json({
            status: "success",
            data: rows
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}
