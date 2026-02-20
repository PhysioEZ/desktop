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
        WHERE branch_id = ? AND (DATE(payment_date) = ? OR DATE(created_at) = ?)
    `, [branchId, todayStr, todayStr]);
    const todayCollection = todayRows[0].total;

    // B. Stats for the selected Range

    // B1. Range Billed: Total bill generated for patients registered in this period
    const [billedRows] = await pool.query(`
        SELECT SUM(total_amount) as total 
        FROM patients 
        WHERE branch_id = ? AND created_at BETWEEN ? AND ?
    `, [branchId, start, end]);
    const rangeBilled = billedRows[0].total || 0;

    // B2. Range Paid: TOTAL CASH COLLECTED in this period (Regardless of registration date)
    const [paidRows] = await pool.query(`
        SELECT SUM(amount) as total 
        FROM payments 
        WHERE branch_id = ? AND payment_date BETWEEN ? AND ?
    `, [branchId, start, end]);
    const rangePaid = paidRows[0].total || 0;

    const rangeDue = rangeBilled - rangePaid;

    // C. Payment Method Breakdown (For charts)
    const [methodRows] = await pool.query(`
        SELECT mode as payment_method, SUM(amount) as total
        FROM payments
        WHERE branch_id = ? AND payment_date BETWEEN ? AND ?
        GROUP BY mode
    `, [branchId, start, end]);

    // D. Collection Trends (Last 7 days)
    const [dbTrendRows] = await pool.query(`
        SELECT DATE(payment_date) as date, SUM(amount) as total
        FROM payments
        WHERE branch_id = ? AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
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
    let whereSql = `p.branch_id = ? AND (
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
