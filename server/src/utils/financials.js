const pool = require('../config/db');

/**
 * centralized function to recalculate and update a patient's financial status.
 * reliably updates: due_amount, advance_payment (effective balance), treatment_cost_per_day
 * 
 * @param {Object} connection - specific db connection (must be part of transaction if applicable)
 * @param {number} patientId - the patient to update
 * @returns {Promise<Object>} - returns the updated { due_amount, effective_balance }
 */
async function recalculatePatientFinancials(connection, patientId) {
    if (!patientId) throw new Error("recalculatePatientFinancials: Patient ID required");

    // 1. fetch patient details
    // using lock for update if inside transaction to prevent race conditions check
    const [ptRows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patientId]);
    const patient = ptRows[0];
    if (!patient) throw new Error("Patient not found for recalculation");

    // 2. aggregate all payments
    const [paidRows] = await connection.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ?",
        [patientId]
    );
    const totalPaid = parseFloat(paidRows[0].total || 0);

    // 3. aggregate history consumption (archived plans)
    const [histRows] = await connection.query(
        "SELECT COALESCE(SUM(consumed_amount), 0) as total FROM patients_treatment WHERE patient_id = ?",
        [patientId]
    );
    const historyConsumed = parseFloat(histRows[0].total || 0);

    // 4. calculate current plan consumption
    let curRate = parseFloat(patient.treatment_cost_per_day || 0);

    // if package, rate is total_amount (discounted net cost) / days
    if (patient.treatment_type === 'package' && patient.treatment_days > 0) {
        curRate = parseFloat(patient.total_amount) / patient.treatment_days;
    }

    const [attRows] = await connection.query(
        "SELECT COUNT(DISTINCT SUBSTR(attendance_date, 1, 10)) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'",
        [patientId, patient.start_date || '2000-01-01']
    );
    const currentAttendanceCount = attRows[0].count;
    const currentConsumed = currentAttendanceCount * curRate;

    // 5. Calculate Total Commitment vs Total Paid
    // Cumulative logic: Dues = (All History Plan Costs + Current Plan Cost) - Total Paid
    // This ensures that abandoned plan debt (the unused part) is PRESERVED if firm commitment.
    const [costRows] = await connection.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM patients_treatment WHERE patient_id = ?",
        [patientId]
    );
    const totalHistoryCost = parseFloat(costRows[0].total || 0);
    const currentPlanCost = parseFloat(patient.total_amount || 0);

    // Final Calculations
    const totalConsumed = historyConsumed + currentConsumed;
    const effectiveBalance = totalPaid - totalConsumed;

    // Final Due Amount (Contractual Liability)
    const dueAmount = Math.max(0, (totalHistoryCost + currentPlanCost) - totalPaid);

    // 6. update patient record
    // effective balance = what they paid - what they used (liquidity)
    // due_amount = total commitment - what they paid (liability)
    await connection.query(
        `UPDATE patients SET 
            advance_payment = ?, 
            due_amount = ?,
            treatment_cost_per_day = ? 
         WHERE patient_id = ?`,
        [effectiveBalance, dueAmount, curRate, patientId]
    );

    return {
        effective_balance: effectiveBalance,
        due_amount: dueAmount,
        total_paid: totalPaid,
        total_consumed: totalConsumed,
        current_consumed: currentConsumed
    };
}

module.exports = { recalculatePatientFinancials };
