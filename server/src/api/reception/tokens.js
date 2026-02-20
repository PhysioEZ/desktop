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

        // Check if token already exists
        const [existingTok] = await pool.query(
            "SELECT * FROM tokens WHERE patient_id = ? AND token_date = ?",
            [patientId, today]
        );

        let tokenData = {};
        if (existingTok.length > 0) {
            const tok = existingTok[0];
            const tokenNo = parseInt(tok.token_uid.split('-').pop());
            tokenData = {
                has_token_today: true,
                print_count: tok.print_count,
                token_uid: tok.token_uid,
                token_number: tokenNo,
                token_date: new Date(tok.token_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
            };
        } else {
            const [countRows] = await pool.query(
                "SELECT COUNT(*) as count FROM tokens WHERE token_date = ?",
                [today]
            );
            const nextTokenNo = countRows[0].count + 1;
            const datePart = today.replace(/-/g, '').slice(2);
            tokenData = {
                has_token_today: false,
                print_count: 0,
                token_uid: `T-${datePart}-${String(nextTokenNo).padStart(2, '0')}`,
                token_number: nextTokenNo,
                token_date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
            };
        }

        // Fetch Branch Details
        const [branchRows] = await pool.query(
            "SELECT clinic_name, address_line_1, phone_primary FROM branches WHERE branch_id = ?",
            [patient.branch_id]
        );
        const branch = branchRows[0] || {};

        res.json({
            success: true,
            data: {
                ...tokenData,
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
                effective_balance: balance,
                pkg_dues: 0,
                payments_history: paymentsHistory,
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

        // 1. Check if token already exists for this patient today
        const [existingToken] = await connection.query(
            "SELECT * FROM tokens WHERE patient_id = ? AND token_date = ? FOR UPDATE",
            [patientId, today]
        );

        if (existingToken.length > 0) {
            const token = existingToken[0];
            
            // Limit reprints to 3 times (Total 4 prints)
            if (token.print_count > 3) {
                await connection.rollback();
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Max reprint limit (3) reached.' 
                });
            }

            // Update print count
            await connection.query(
                "UPDATE tokens SET print_count = print_count + 1 WHERE token_id = ?",
                [token.token_id]
            );

            const { patient, paidToday, balance, currentAttendanceCount, treatmentDays, paymentsHistory } = await getPatientFinancials(connection, patientId, today);

            // Fetch Branch Details
            const [branchRows] = await connection.query(
                "SELECT clinic_name, address_line_1, phone_primary FROM branches WHERE branch_id = ?",
                [patient.branch_id]
            );
            const branch = branchRows[0] || {};

            // Extract number from UID (T-YYMMDD-XX)
            const tokenNo = parseInt(token.token_uid.split('-').pop());

            await connection.commit();

            return res.json({
                success: true,
                status: 'REPRINT',
                message: `This is reprint #${token.print_count}`,
                data: {
                    token_date: new Date(token.token_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
                    token_uid: token.token_uid,
                    token_number: tokenNo,
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
                    effective_balance: balance,
                    pkg_dues: 0,
                    payments_history: paymentsHistory,
                    clinic_name: branch.clinic_name || 'ProSpine Clinic',
                    branch_address: branch.address_line_1 || '',
                    branch_phone: branch.phone_primary || '',
                    has_token_today: true,
                    print_count: token.print_count + 1
                }
            });
        }

        // 2. Otherwise generate new token
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

        await connection.query(
            "INSERT INTO tokens (patient_id, branch_id, service_type, token_uid, token_date, print_count, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())",
            [patientId, patient.branch_id, patient.service_type || 'General', tokenUid, today]
        );

        await connection.commit();

        res.json({
            success: true,
            status: 'NEW',
            data: {
                token_date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
                token_uid: tokenUid,
                token_number: tokenNo,
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
                effective_balance: balance,
                pkg_dues: 0,
                payments_history: paymentsHistory,
                clinic_name: branch.clinic_name || 'ProSpine Clinic',
                branch_address: branch.address_line_1 || '',
                branch_phone: branch.phone_primary || '',
                has_token_today: true,
                print_count: 1
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
