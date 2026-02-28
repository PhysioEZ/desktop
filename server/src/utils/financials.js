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

    // 5. final calculations
    const totalConsumed = historyConsumed + currentConsumed;

    // effective balance = what they paid - what they used
    // positive = they have money in wallet
    // negative = they owe money for what they used
    const effectiveBalance = totalPaid - totalConsumed;

    // due amount = total plan cost (including current) - total paid
    // this reflects "how much more do i need to pay to finish this plan?"
    // note: if they have a history of debt, total_amount should theoretically include it, 
    // but in this system it seems 'total_amount' is just the current plan's cost.
    // so due_amount is strictly about the current commitment vs what's been paid.
    // however, if they had previous debt, it should be carried over.
    // current logic implies: 
    // due = (current_plan_total) - (total_paid - history_consumed) 
    //     = current_plan_total - (total available for current plan)
    //     = current_plan_total - (total_paid - history_consumed)
    //     = current_plan_total - total_paid + history_consumed

    // verify 'total_amount' handling:
    // in registration/edit, total_amount IS the current plan cost.

    const currentPlanCost = parseFloat(patient.total_amount || 0);

    // debt/credit from past
    const balanceFromHistory = totalPaid - historyConsumed;

    // due = cost - (net available)
    const dueAmount = currentPlanCost - balanceFromHistory;

    // 6. update patient record
    // we also update 'treatment_cost_per_day' to ensure consistency if it was a package calculation
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
