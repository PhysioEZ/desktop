const pool = require("../../config/db");
const fs = require("fs");
const path = require("path");
const sqlite = require("../../config/sqlite");
const SyncService = require("../../services/SyncService");


// Main Handler
exports.handlePatientsRequest = async (req, res) => {
    const input = { ...req.query, ...req.body };
    const action = input.action || "fetch";
    const branchId = req.user.branch_id || input.branch_id;

    if (!branchId)
        return res
            .status(400)
            .json({ status: "error", message: "Branch ID required" });

    // Run Daily Cleanup (Auto-deactivation)
    await runDailyCleanup(branchId);

    try {
        switch (action) {
            case "fetch":
                await fetchPatients(req, res, branchId, input);
                break;
            case "fetch_filters":
                await fetchFilters(req, res, branchId);
                break;
            case "fetch_details":
                await fetchDetails(req, res, input.patient_id);
                break;
            case "toggle_status":
                await toggleStatus(req, res, input.patient_id, input.status);
                break;
            default:
                res.status(400).json({ status: "error", message: "Invalid action" });
        }
    } catch (error) {
        console.error("Patients Controller Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

async function runDailyCleanup(branchId) {
    const tmpDir = path.join(__dirname, "../../../tmp/cleanup");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const cleanupFile = path.join(tmpDir, `last_cleanup_${branchId}.txt`);
    const todayDate = new Date().toISOString().split("T")[0];

    let lastRunDate = "";
    if (fs.existsSync(cleanupFile)) {
        lastRunDate = fs.readFileSync(cleanupFile, "utf8").trim();
    }

    if (lastRunDate !== todayDate) {
        try {
            const sql = `
                UPDATE patients 
                SET status = 'inactive'
                WHERE branch_id = ? 
                  AND status = 'active'
                  AND patient_id IN (
                    SELECT p.patient_id
                    FROM patients p
                    LEFT JOIN (
                        SELECT patient_id, MAX(attendance_date) as last_visit 
                        FROM attendance 
                        GROUP BY patient_id
                    ) a ON p.patient_id = a.patient_id
                    WHERE (a.last_visit IS NOT NULL AND a.last_visit < date('now', '-3 days'))
                       OR (a.last_visit IS NULL AND p.created_at < datetime('now', '-3 days'))
                  )`;
            await pool.query(sql, [branchId]);
            fs.writeFileSync(cleanupFile, todayDate);
        } catch (error) {
            console.error("Auto-deactivation failed:", error);
        }
    }
}

async function fetchFilters(req, res, branchId) {
    // All reads from local SQLite cache
    const doctors = sqlite.prepare(
        "SELECT DISTINCT assigned_doctor FROM patients WHERE branch_id = ? AND assigned_doctor IS NOT NULL AND assigned_doctor != '' ORDER BY assigned_doctor"
    ).all(branchId);

    const treatments = sqlite.prepare(
        "SELECT DISTINCT treatment_type FROM patients WHERE branch_id = ? AND treatment_type IS NOT NULL AND treatment_type != '' ORDER BY treatment_type"
    ).all(branchId);

    const statuses = sqlite.prepare(
        "SELECT DISTINCT status FROM patients WHERE branch_id = ? AND status IS NOT NULL AND status != '' ORDER BY status"
    ).all(branchId);

    const services = sqlite.prepare(
        "SELECT DISTINCT service_type FROM patients WHERE branch_id = ? AND service_type IS NOT NULL AND service_type != '' ORDER BY service_type"
    ).all(branchId);

    const paymentMethods = sqlite.prepare(
        "SELECT method_id, method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order"
    ).all(branchId);

    const regReferrers = sqlite.prepare(
        "SELECT DISTINCT reffered_by FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != ''"
    ).all(branchId);
    const testInqReferrers = sqlite.prepare(
        "SELECT DISTINCT reffered_by FROM test_inquiry WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != ''"
    ).all(branchId);
    const testReferrers = sqlite.prepare(
        "SELECT DISTINCT referred_by as reffered_by FROM tests WHERE branch_id = ? AND referred_by IS NOT NULL AND referred_by != ''"
    ).all(branchId);
    const referrerSet = new Set([...regReferrers, ...testInqReferrers, ...testReferrers].map(r => r.reffered_by));

    const counts = sqlite.prepare(`
        SELECT
            COUNT(CASE WHEN DATE(created_at) = DATE('now','localtime') THEN 1 END) as new_today,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
            COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
            COUNT(CASE WHEN status IN ('stopped','completed') THEN 1 END) as terminated_count,
            COUNT(*) as total_count
        FROM patients WHERE branch_id = ?
    `).get(branchId);

    const trackRows = sqlite.prepare("SELECT id, pricing FROM service_tracks").all();
    const tracksMap = new Map();
    trackRows.forEach(t => tracksMap.set(t.id, typeof t.pricing === 'string' ? JSON.parse(t.pricing) : t.pricing));

    const resolvedTreatments = new Map();
    for (const t of treatments) {
        let value = t.treatment_type, label = value;
        for (const pricing of tracksMap.values()) {
            const plan = pricing.plans?.find(pl => String(pl.id) === String(value));
            if (plan) { label = plan.name; break; }
        }
        resolvedTreatments.set(value, label);
    }

    res.json({
        status: "success",
        data: {
            doctors: doctors.map(d => d.assigned_doctor),
            treatments: Array.from(resolvedTreatments.entries()).map(([value, label]) => ({ label, value })),
            statuses: statuses.map(s => s.status),
            services: services.map(s => s.service_type),
            payment_methods: paymentMethods,
            referrers: [...referrerSet].sort(),
            counts
        }
    });
}


async function fetchPatients(req, res, branchId, input) {
    const page = parseInt(input.page) || 1;
    const limit = parseInt(input.limit) || 16;
    const search = input.search || "";
    const service_type = input.service_type || "";
    const doctor = input.doctor || "";
    const treatment = input.treatment || "";
    const status = input.status || "";
    const offset = (page - 1) * limit;

    let whereClauses = ["p.branch_id = ?"];
    let params = [branchId];

    if (search) {
        whereClauses.push("(r.patient_name LIKE ? OR r.phone_number LIKE ? OR pm.patient_uid LIKE ?)");
        const p = `%${search}%`;
        params.push(p, p, p);
    }
    if (service_type) { whereClauses.push("p.service_type = ?"); params.push(service_type); }
    if (doctor) { whereClauses.push("p.assigned_doctor = ?"); params.push(doctor); }
    if (treatment) { whereClauses.push("p.treatment_type = ?"); params.push(treatment); }
    if (status) { whereClauses.push("p.status = ?"); params.push(status); }

    const whereSql = whereClauses.join(" AND ");

    // Count query (local)
    const total = sqlite.prepare(`
        SELECT COUNT(*) as count
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE ${whereSql}
    `).get(...params)?.count || 0;

    // Main data query (local SQLite — CURDATE() → DATE('now','localtime'), tokens table may not exist so LEFT JOIN safe)
    const patients = sqlite.prepare(`
        SELECT
            p.patient_id, p.treatment_type, p.service_type, p.service_track_id, p.treatment_cost_per_day,
            p.package_cost, p.treatment_days, p.total_amount, p.advance_payment,
            p.discount_amount, p.due_amount, p.assigned_doctor, p.start_date,
            pm.patient_uid, p.end_date, p.status AS patient_status,
            r.registration_id, r.patient_name, r.phone_number AS patient_phone,
            r.age AS patient_age, r.chief_complain AS patient_condition,
            r.created_at, r.patient_photo_path,
            COALESCE(pay.total_paid, 0) as total_paid,
            COALESCE(hist.total_history_consumed, 0) as total_history_consumed,
            COALESCE(cur_att.count, 0) as attendance_count,
            (CASE
                WHEN p.treatment_type = 'package' AND p.treatment_days > 0
                THEN CAST(p.package_cost AS REAL) / p.treatment_days
                ELSE p.treatment_cost_per_day
            END) as cost_per_day,
            today_att.status as today_attendance
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        LEFT JOIN (SELECT patient_id, SUM(amount) as total_paid FROM payments GROUP BY patient_id) pay ON p.patient_id = pay.patient_id
        LEFT JOIN (SELECT patient_id, SUM(consumed_amount) as total_history_consumed FROM patients_treatment GROUP BY patient_id) hist ON p.patient_id = hist.patient_id
        LEFT JOIN (
            SELECT a.patient_id, COUNT(*) as count
            FROM attendance a JOIN patients p2 ON a.patient_id = p2.patient_id
            WHERE a.attendance_date >= COALESCE(p2.start_date,'2000-01-01') AND a.status = 'present'
            GROUP BY a.patient_id
        ) cur_att ON p.patient_id = cur_att.patient_id
        LEFT JOIN attendance today_att ON p.patient_id = today_att.patient_id AND today_att.attendance_date = DATE('now','localtime')
        WHERE ${whereSql}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Resolve plan names from local service_tracks
    const trackRows = sqlite.prepare("SELECT id, pricing FROM service_tracks").all();
    const tracksMap = new Map();
    trackRows.forEach(t => tracksMap.set(t.id, typeof t.pricing === 'string' ? JSON.parse(t.pricing) : t.pricing));

    patients.forEach(p => {
        const curConsumed = p.attendance_count * (parseFloat(p.cost_per_day) || 0);
        p.total_paid = parseFloat(p.total_paid) || 0;
        p.total_history_consumed = parseFloat(p.total_history_consumed) || 0;
        p.effective_balance = p.total_paid - (p.total_history_consumed + curConsumed);
        p.cost_per_day = parseFloat(p.cost_per_day);
        p.due_amount = parseFloat(p.total_amount) > 0
            ? parseFloat(p.total_amount) - p.total_paid - (parseFloat(p.discount_amount) || 0)
            : (p.effective_balance < 0 ? Math.abs(p.effective_balance) : 0);
        if (p.due_amount < 0) p.due_amount = 0;

        if (p.service_track_id && tracksMap.has(p.service_track_id)) {
            const pricing = tracksMap.get(p.service_track_id);
            const plan = pricing.plans?.find(pl => String(pl.id) === String(p.treatment_type));
            if (plan) p.treatment_type = plan.name;
        }
    });

    res.json({
        status: 'success',
        data: patients,
        pagination: { total, page, limit, total_pages: Math.ceil(total / limit) }
    });
}


async function fetchDetails(req, res, patientId) {
    let p;
    let totalPaid = 0;
    let tests = [];
    let attendance = [];
    let treatmentHistory = [];
    let combinedHistory = [];

    if (patientId) {
        const [ptRows] = await pool.query(`
            SELECT p.*, 
                   r.patient_name, r.phone_number, r.email, r.gender, r.age, 
                   r.referralSource, r.reffered_by, r.chief_complain, r.occupation, r.address
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE p.patient_id = ?
        `, [patientId]);
        p = ptRows[0];
        if (!p)
            return res
                .status(404)
                .json({ status: "error", message: "Patient not found" });

        const [paidRows] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ?",
            [patientId],
        );
        const [testPaidRows] = await pool.query(
            "SELECT COALESCE(SUM(tp.amount), 0) as total FROM test_payments tp JOIN tests t ON tp.test_id = t.test_id WHERE t.patient_id = ?",
            [patientId]
        );
        totalPaid = parseFloat(paidRows[0].total || 0) + parseFloat(testPaidRows[0].total || 0);

        const [testBilledRows] = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM tests WHERE patient_id = ?",
            [patientId]
        );
        p.test_billed_amount = parseFloat(testBilledRows[0].total || 0);

        let totalConsumed = 0;
        const [history] = await pool.query(
            "SELECT treatment_type, treatment_days, package_cost, treatment_cost_per_day, start_date, end_date, consumed_amount FROM patients_treatment WHERE patient_id = ?",
            [patientId],
        );
        for (let h of history) {
            if (h.consumed_amount != null && h.consumed_amount > 0) {
                totalConsumed += parseFloat(h.consumed_amount);
            } else {
                const [hAttRows] = await pool.query(
                    "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'",
                    [patientId, h.start_date, h.end_date],
                );
                const hCount = hAttRows[0].count;
                const hRate =
                    h.treatment_type === "package" && h.treatment_days > 0
                        ? parseFloat(h.package_cost) / h.treatment_days
                        : parseFloat(h.treatment_cost_per_day);
                totalConsumed += hCount * hRate;
            }
        }

        const curRate =
            p.treatment_type === "package" && p.treatment_days > 0
                ? parseFloat(p.package_cost) / p.treatment_days
                : parseFloat(p.treatment_cost_per_day || p.cost_per_day);
        const [cAttRows] = await pool.query(
            "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'",
            [patientId, p.start_date || "2000-01-01"],
        );
        const cCount = cAttRows[0].count;
        totalConsumed += cCount * curRate;

        p.effective_balance = totalPaid - totalConsumed;
        p.attendance_count = cCount;
        p.cost_per_day = curRate;

        // Calculate Due Amount
        const planCost = parseFloat(p.total_amount || 0);
        const discountAmount = parseFloat(p.discount_amount || 0);
        if (planCost > 0) {
            p.due_amount = planCost - totalPaid - discountAmount;
        } else {
            p.due_amount = p.effective_balance < 0 ? Math.abs(p.effective_balance) : 0;
        }
        if (p.due_amount < 0) p.due_amount = 0;

        p.total_consumed = totalConsumed;
        p.total_paid = totalPaid;

        // Resolve plan name for current plan
        if (p.service_track_id) {
            const [tRows] = await pool.query("SELECT pricing FROM service_tracks WHERE id = ?", [p.service_track_id]);
            if (tRows.length > 0) {
                const pricing = typeof tRows[0].pricing === 'string' ? JSON.parse(tRows[0].pricing) : tRows[0].pricing;
                const plan = pricing.plans?.find(pl => String(pl.id) === String(p.treatment_type));
                if (plan) p.treatment_type = plan.name;
            }
        }

        const [todayPaidRows] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ? AND DATE(payment_date) = CURDATE()",
            [patientId],
        );
        p.has_payment_today = parseFloat(todayPaidRows[0].total || 0);

        const [treatmentPayments] = await pool.query(
            "SELECT payment_id, amount, payment_date, mode as payment_method, remarks, created_at, 'treatment' as type FROM payments WHERE patient_id = ? ORDER BY payment_date DESC, created_at DESC",
            [patientId],
        );
        const [testPayments] = await pool.query(
            `SELECT tp.id as payment_id, tp.amount, tp.created_at as payment_date, tp.payment_method, t.test_name, 'test' as type 
             FROM test_payments tp 
             JOIN tests t ON tp.test_id = t.test_id 
             WHERE t.patient_id = ? 
             ORDER BY tp.created_at DESC`,
            [patientId]
        );
        combinedHistory = [...treatmentPayments, ...testPayments].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

        const [attendanceRows] = await pool.query(
            "SELECT attendance_id, attendance_date, status, created_at FROM attendance WHERE patient_id = ? ORDER BY attendance_date DESC LIMIT 50",
            [patientId],
        );
        attendance = attendanceRows;

        const [historyRows] = await pool.query(
            "SELECT treatment_id as id, treatment_type, treatment_days, package_cost, treatment_cost_per_day, total_amount, advance_payment, discount_amount, start_date, end_date, created_at FROM patients_treatment WHERE patient_id = ? ORDER BY start_date DESC",
            [patientId],
        );
        treatmentHistory = historyRows;

        const [testRows] = await pool.query(
            "SELECT test_id, test_uid, test_name, total_amount, test_status, payment_status, created_at FROM tests WHERE patient_id = ? ORDER BY created_at DESC",
            [patientId]
        );
        tests = testRows;
    } else {
        const { patient_name, phone_number } = req.body;
        if (!patient_name) {
            return res.status(400).json({ status: "error", message: "Patient ID or Name required" });
        }

        const [testRows] = await pool.query(
            "SELECT * FROM tests WHERE patient_name = ? AND phone_number = ? AND (patient_id IS NULL OR patient_id = 0) AND test_status != 'cancelled' ORDER BY created_at DESC",
            [patient_name, phone_number]
        );

        if (testRows.length === 0) {
            return res.status(404).json({ status: "error", message: "No records found" });
        }

        const first = testRows[0];
        p = {
            patient_id: 0,
            patient_name: first.patient_name,
            phone_number: first.phone_number,
            gender: first.gender,
            age: first.age,
            address: first.address,
            created_at: first.created_at,
            total_amount: 0,
            due_amount: testRows.reduce((sum, t) => sum + parseFloat(t.due_amount || 0), 0),
            total_paid: 0,
            effective_balance: 0
        };

        const [tpRows] = await pool.query(
            `SELECT tp.id as payment_id, tp.amount, tp.created_at as payment_date, tp.payment_method, t.test_name, 'test' as type 
             FROM test_payments tp 
             JOIN tests t ON tp.test_id = t.test_id 
             WHERE t.patient_name = ? AND t.phone_number = ? AND (t.patient_id IS NULL OR t.patient_id = 0)
             ORDER BY tp.created_at DESC`,
            [patient_name, phone_number]
        );

        combinedHistory = tpRows;
        tests = testRows;
        p.total_paid = tpRows.reduce((sum, tp) => sum + parseFloat(tp.amount), 0);
        p.test_billed_amount = testRows.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);

        const [todayPaidRows] = await pool.query(
            `SELECT COALESCE(SUM(tp.amount), 0) as total 
             FROM test_payments tp 
             JOIN tests t ON tp.test_id = t.test_id 
             WHERE t.patient_name = ? AND t.phone_number = ? AND (t.patient_id IS NULL OR t.patient_id = 0) AND DATE(tp.created_at) = CURDATE()`,
            [patient_name, phone_number]
        );
        p.has_payment_today = parseFloat(todayPaidRows[0].total || 0);
    }

    res.json({
        status: "success",
        data: {
            ...p,
            payments: combinedHistory,
            attendance,
            history: treatmentHistory,
            tests,
        },
    });
}

async function toggleStatus(req, res, patientId, status) {
    if (!patientId)
        return res
            .status(400)
            .json({ status: "error", message: "Patient ID required" });

    // Toggle if status not provided
    if (!status) {
        const [ptRows] = await pool.query(
            "SELECT status FROM patients WHERE patient_id = ?",
            [patientId],
        );
        if (ptRows.length === 0)
            return res
                .status(404)
                .json({ status: "error", message: "Patient not found" });
        status = ptRows[0].status === "active" ? "inactive" : "active";
    }

    await pool.query("UPDATE patients SET status = ? WHERE patient_id = ?", [
        status,
        patientId,
    ]);
    res.json({
        success: true,
        status: "success",
        new_status: status,
        message: `Patient marked as ${status}`,
    });
}


