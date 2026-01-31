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

    // 1. Calculate Summary Metrics (Independent of grid filters for Billed/Due, but specific for Collection)

    // A. Today's Collection (Cash in hand today, regardless of date range)
    const [todayRows] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE branch_id = ? AND DATE(payment_date) = CURDATE()
    `, [branchId]);
    const todayCollection = todayRows[0].total;

    // B. Stats for the selected Range (Patients created in this range, matching legacy logic)
    // We also need to sum their financials.

    // Query to fetch grid data (Patients)
    // Adapted from legacy: showing patients created/registered in this period
    let whereSql = "p.branch_id = ? AND p.created_at BETWEEN ? AND ?";
    let params = [branchId, start, end];

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
            p.created_at,
            r.patient_name, r.phone_number,
            (
                SELECT COALESCE(SUM(amount), 0) 
                FROM payments 
                WHERE patient_id = p.patient_id
            ) as total_paid,
            (
                SELECT MAX(created_at)
                FROM payments
                WHERE patient_id = p.patient_id
            ) as last_payment_date,
            (
                SELECT COUNT(*)
                FROM payments
                WHERE patient_id = p.patient_id AND DATE(payment_date) = CURDATE()
            ) as has_payment_today
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        WHERE ${whereSql}
        ORDER BY p.created_at DESC
    `;

    const [patients] = await pool.query(query, params);

    // Calculate aggregations for the cards based on the FILTERED selection ? 
    // Usually dashboard cards show global stats for the period, and table shows details.
    // Legacy shows "Billed (Range)" which is sum of all patients in that range.

    // Let's get the summary for ALL patients in that range (ignoring search text, but respecting period)
    const summaryQuery = `
        SELECT 
            SUM(p.total_amount) as total_billed,
            SUM(
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = p.patient_id)
            ) as total_paid
        FROM patients p
        WHERE p.branch_id = ? AND p.created_at BETWEEN ? AND ?
    `;
    const [summaryRows] = await pool.query(summaryQuery, [branchId, start, end]);

    const rangeBilled = summaryRows[0].total_billed || 0;
    const rangePaid = summaryRows[0].total_paid || 0;
    const rangeDue = rangeBilled - rangePaid;

    res.json({
        status: "success",
        data: {
            stats: {
                today_collection: todayCollection,
                range_billed: rangeBilled,
                range_paid: rangePaid,
                range_due: rangeDue
            },
            records: patients
        }
    });
}
