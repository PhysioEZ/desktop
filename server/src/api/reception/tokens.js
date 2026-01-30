const pool = require('../../config/db');

exports.handleTokensRequest = async (req, res) => {
    const input = { ...req.query, ...req.body };
    const action = input.action || 'get_data';
    const patientId = input.patient_id;

    if (!patientId) return res.status(400).json({ status: 'error', message: 'Patient ID required' });

    try {
        switch (action) {
            case 'get_data':
                await getTokenData(req, res, patientId);
                break;
            case 'generate':
                await generateToken(req, res, patientId);
                break;
            default:
                res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Tokens Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

async function getPatientFinancials(conn, patientId, today) {
    // Ensure ID is int
    const pId = parseInt(patientId, 10);

    // Patient Details
    const [ptRows] = await conn.query(
        `SELECT p.*, r.patient_name, r.phone_number, pm.patient_uid 
         FROM patients p 
         JOIN registration r ON p.registration_id = r.registration_id 
         LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
         WHERE p.patient_id = ?`,
        [pId]
    );
    const patient = ptRows[0];
    if (!patient) throw new Error("Patient not found");

    // Paid data
    const [paidTodayRows] = await conn.query(
        "SELECT SUM(amount) as total FROM payments WHERE patient_id = ? AND payment_date = ?",
        [pId, today]
    );
    const paidToday = parseFloat(paidTodayRows[0].total || 0);

    const [allPaidRows] = await conn.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ?",
        [pId]
    );
    let totalPaid = parseFloat(allPaidRows[0].total || 0);

    // FALLBACK: If no payments recorded, use advance_payment from patient record (Legacy logic)
    if (totalPaid === 0) {
        totalPaid = parseFloat(patient.advance_payment || 0);
    }

    // Fetch History
    const [paymentsHistory] = await conn.query(
        "SELECT payment_date, remarks, mode, amount FROM payments WHERE patient_id = ? ORDER BY payment_date ASC",
        [pId]
    );

    // Consumed Calculation
    let totalConsumed = 0;
    const [history] = await conn.query("SELECT * FROM patients_treatment WHERE patient_id = ?", [pId]);
    for (let h of history) {
        // Only count PRESENT attendance
        const [hAtt] = await conn.query(
            "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'",
            [pId, h.start_date, h.end_date]
        );

        // Dynamic Rate Calculation (No hardcoded type checks)
        // If package_cost exists and days > 0, assume prorated cost.
        // Otherwise use per-day cost.
        const pkgCost = parseFloat(h.package_cost || 0);
        const days = parseInt(h.treatment_days || 0, 10);
        const dailyCost = parseFloat(h.treatment_cost_per_day || 0);

        const rate = (pkgCost > 0 && days > 0) ? (pkgCost / days) : dailyCost;

        totalConsumed += (hAtt[0].count * rate);
    }

    // Current Plan Consumption
    const curPkgCost = parseFloat(patient.package_cost || 0);
    const curDays = parseInt(patient.treatment_days || 0, 10);
    const curDailyCost = parseFloat(patient.treatment_cost_per_day || 0);

    // Dynamic Logic: Prefer package prorated calculation if valid, else daily cost.
    const curRate = (curPkgCost > 0 && curDays > 0) ? (curPkgCost / curDays) : curDailyCost;

    const [cAtt] = await conn.query(
        "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'",
        [pId, patient.start_date || '2000-01-01']
    );
    const currentAttendanceCount = cAtt[0].count;
    totalConsumed += (currentAttendanceCount * curRate);

    const balance = totalPaid - totalConsumed;

    return {
        patient,
        paidToday,
        balance,
        currentAttendanceCount,
        treatmentDays: patient.treatment_days,
        paymentsHistory
    };
}

async function getTokenData(req, res, patientId) {
    try {
        const today = new Date().toISOString().split("T")[0];
        const { patient, paidToday, balance, currentAttendanceCount, treatmentDays, paymentsHistory } = await getPatientFinancials(pool, patientId, today);

        const [countRows] = await pool.query(
            "SELECT COUNT(*) as count FROM tokens WHERE token_date = ?",
            [today]
        );
        const nextTokenNo = countRows[0].count + 1;

        // Fetch Branch Details
        const [branchRows] = await pool.query(
            "SELECT clinic_name, address_line_1, phone_primary FROM branches WHERE branch_id = ?",
            [patient.branch_id]
        );
        const branch = branchRows[0] || {};

        // Formatting Token UID: T-YYMMDD-XX
        const datePart = today.replace(/-/g, '').slice(2);
        const tokenUid = `T-${datePart}-${String(nextTokenNo).padStart(2, '0')}`;

        res.json({
            success: true,
            data: {
                token_date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
                token_uid: tokenUid,
                token_number: nextTokenNo,
                patient_name: patient.patient_name,
                patient_phone: patient.phone_number,
                treatment_type: patient.treatment_type,
                start_date: patient.start_date,
                end_date: patient.end_date,
                total_plan_cost: patient.total_amount,
                plan_days: patient.treatment_days,
                cost_per_day: patient.treatment_cost_per_day,
                session_time: patient.treatment_time_slot,
                discount: patient.discount_amount,
                patient_uid: patient.patient_uid,
                patient_id: patient.patient_id,
                assigned_doctor: patient.assigned_doctor,
                attendance_progress: `${currentAttendanceCount}/${treatmentDays}`,
                paid_today: paidToday,
                due_amount: balance < 0 ? Math.abs(balance) : 0,
                effective_balance: balance, // Changed from remaining_balance to effective_balance
                pkg_dues: 0, // Explicitly sending 0 as requested
                payments_history: paymentsHistory,
                // Branch Info
                clinic_name: branch.clinic_name || 'ProSpine Clinic',
                branch_address: branch.address_line_1 || '',
                branch_phone: branch.phone_primary || ''
            }
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
}

async function generateToken(req, res, patientId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const today = new Date().toISOString().split("T")[0];

        // Use helper with transaction connection
        // Note: Helper uses 'conn.query'. 'connection' object has 'query' method.
        const { patient, paidToday, balance, currentAttendanceCount, treatmentDays, paymentsHistory } = await getPatientFinancials(connection, patientId, today);

        const [countRows] = await connection.query(
            "SELECT COUNT(*) as count FROM tokens WHERE token_date = ? FOR UPDATE",
            [today]
        );
        const tokenNo = countRows[0].count + 1;

        // Fetch Branch Details
        const [branchRows] = await connection.query(
            "SELECT clinic_name, address_line_1, phone_primary FROM branches WHERE branch_id = ?",
            [patient.branch_id]
        );
        const branch = branchRows[0] || {};

        const datePart = today.replace(/-/g, '').slice(2);
        const tokenUid = `T-${datePart}-${String(tokenNo).padStart(2, '0')}`;

        // Fixed Insert: Removed token_number, status. Added branch_id, service_type.
        await connection.query(
            "INSERT INTO tokens (patient_id, branch_id, service_type, token_uid, token_date, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            [patientId, patient.branch_id, patient.service_type || 'General', tokenUid, today]
        );

        await connection.commit();

        // Return the GENERATED token data
        res.json({
            success: true,
            data: {
                token_date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
                token_uid: tokenUid,
                token_number: tokenNo, // ACTUALLY generated number
                patient_name: patient.patient_name,
                patient_phone: patient.phone_number,
                treatment_type: patient.treatment_type,
                start_date: patient.start_date,
                end_date: patient.end_date,
                total_plan_cost: patient.total_amount,
                plan_days: patient.treatment_days,
                cost_per_day: patient.treatment_cost_per_day,
                session_time: patient.treatment_time_slot,
                discount: patient.discount_amount,
                patient_uid: patient.patient_uid,
                patient_id: patient.patient_id,
                assigned_doctor: patient.assigned_doctor,
                attendance_progress: `${currentAttendanceCount}/${treatmentDays}`,
                paid_today: paidToday,
                due_amount: balance < 0 ? Math.abs(balance) : 0,
                effective_balance: balance, // Changed from remaining_balance to effective_balance
                pkg_dues: 0,
                payments_history: paymentsHistory,
                // Branch Info
                clinic_name: branch.clinic_name || 'ProSpine Clinic',
                branch_address: branch.address_line_1 || '',
                branch_phone: branch.phone_primary || ''
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
}
