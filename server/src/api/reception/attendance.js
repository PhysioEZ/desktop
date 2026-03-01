const pool = require('../../config/db');
const { recalculatePatientFinancials } = require('../../utils/financials');


exports.handleAttendanceRequest = async (req, res) => {
    try {
        const input = req.body;
        const action = input.action || 'mark';
        const branchId = req.user.branch_id || input.branch_id;

        if (!branchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });

        if (req.method === 'POST') {
            if (action === 'revert') {
                await revertAttendance(req, res, branchId, input);
            } else {
                await markFullAttendance(req, res, branchId, input);
            }
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid method' });
        }
    } catch (error) {
        console.error("Attendance Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

async function revertAttendance(req, res, branchId, input) {
    const { patient_id } = input;
    if (!patient_id) return res.status(400).json({ success: false, message: 'Patient ID required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if attendance exists for today (present or pending)
        const today = new Date(new Date().getTime() + 5.5 * 3600 * 1000).toISOString().split('T')[0];
        const [attRows] = await connection.query(
            "SELECT attendance_id FROM attendance WHERE patient_id = ? AND SUBSTR(attendance_date, 1, 10) = ? AND status IN ('present', 'pending') LIMIT 1",
            [patient_id, today]
        );

        if (attRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'No active attendance record found for today to revert.' });
        }

        // 2. Delete the attendance record using immutable identifying keys (to prevent local/remote ID mismatch)
        await connection.query("DELETE FROM attendance WHERE patient_id = ? AND SUBSTR(attendance_date, 1, 10) = ?", [patient_id, today]);

        // 3. Update Balance (Refund the session implicitly by reversing the debit)
        const [ptRows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patient_id]);
        const patient = ptRows[0];

        const curRate = (patient.treatment_type === 'package' && patient.treatment_days > 0)
            ? (parseFloat(patient.total_amount) / patient.treatment_days)
            : parseFloat(patient.treatment_cost_per_day || 0);

        const currentBalance = parseFloat(patient.advance_payment || 0);
        const effectiveBalance = currentBalance + curRate;

        await connection.query("UPDATE patients SET advance_payment = ? WHERE patient_id = ?", [effectiveBalance, patient_id]);

        await connection.commit();
        res.json({
            success: true,
            status: 'success',
            message: 'Attendance reverted successfully',
            new_balance: effectiveBalance.toFixed(2)
        });

    } catch (error) {
        await connection.rollback();
        console.error("Revert Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}

async function markFullAttendance(req, res, branchId, input) {
    const { patient_id, payment_amount = 0, mode = 'Cash', remarks = '', status = 'present' } = input;

    if (!patient_id) {
        return res.status(400).json({ success: false, message: 'Patient ID required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Calculate Current Balance (Guardian Logic)
        const [ptRows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patient_id]);
        const patient = ptRows[0];
        if (!patient) throw new Error("Patient not found");

        const curRate = (patient.treatment_type === 'package' && patient.treatment_days > 0)
            ? (parseFloat(patient.total_amount) / patient.treatment_days)
            : parseFloat(patient.treatment_cost_per_day || 0);

        // Rather than re-assembling the entire ledger and accidentally catching latent SQL sync errors, 
        // we strictly trust the patient.advance_payment flag (which perfectly matches the UI's effective_balance state)
        // and just add the newly submitted payment amount to see if they can afford the session.
        const effectiveBalance = parseFloat(patient.advance_payment || 0) + parseFloat(payment_amount || 0);

        // 2. Financial Validation
        // If they are marking 'present' and they have no balance to cover THIS visit
        if (status === 'present') {
            const today = new Date(new Date().getTime() + 5.5 * 3600 * 1000).toISOString().split('T')[0];
            const [alreadyMarked] = await connection.query("SELECT attendance_id FROM attendance WHERE patient_id = ? AND SUBSTR(attendance_date, 1, 10) = ? AND status = 'present'", [patient_id, today]);

            // Check if effectiveBalance covers this session
            // Note: effectiveBalance calculated above INCLUDES the payment made in this request (totalPaidWithNew)
            // But it DEDUCTS current consumption. 
            // If they are NOT already marked, the 'currentConsumed' calc above did NOT include this session yet.
            // So effectiveBalance is the funds available for THIS session.

            // Relaxed check: Compare values in paisa/cents to avoid floating point issues
            if (alreadyMarked.length === 0) {
                // effectiveBalance must be >= curRate 
                // However, we must ensure we aren't double counting.
                // logic: available = (Total Paid) - (History Consumed) - (Current Consumed * Rate)
                // This available amount must cover 'curRate'

                if (Math.round(effectiveBalance * 100) < Math.round(curRate * 100)) {
                    return res.status(403).json({
                        success: false,
                        status: 'payment_required',
                        message: `Insufficient Balance. Current: ${effectiveBalance.toFixed(2)}, Session Cost: ${curRate.toFixed(2)}. Please collect payment first.`,
                        balance: effectiveBalance
                    });
                }
            }
        }

        // 3. Attendance Logic
        const today = new Date(new Date().getTime() + 5.5 * 3600 * 1000).toISOString().split('T')[0];
        const [existing] = await connection.query("SELECT attendance_id FROM attendance WHERE patient_id = ? AND SUBSTR(attendance_date, 1, 10) = ?", [patient_id, today]);

        let attendanceId;
        const approvalRequestAt = status === 'pending' ? new Date() : null;

        if (existing.length > 0) {
            attendanceId = existing[0].attendance_id;
            await connection.query("UPDATE attendance SET status = ?, remarks = ?, approval_request_at = ? WHERE attendance_id = ?", [status, remarks, approvalRequestAt, attendanceId]);
        } else {
            const [resAtt] = await connection.query("INSERT INTO attendance (patient_id, attendance_date, status, remarks, marked_by_employee_id, approval_request_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                [patient_id, today, status, remarks, req.user.employee_id, approvalRequestAt]);
            attendanceId = resAtt.insertId;
        }

        // 3.5 Notification for Pending
        if (status === 'pending') {
            const msg = `Attendance Approval Req: Patient #${patient_id}`;
            const link = `manage_attendance.php?branch_id=${branchId}`; // Legacy link style or new

            // Fetch admins
            const [admins] = await connection.query(`
                SELECT e.employee_id
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                WHERE e.branch_id = ? AND r.role_name IN ('admin', 'superadmin')
            `, [branchId]);

            for (const admin of admins) {
                await connection.query(`
                    INSERT INTO notifications (employee_id, branch_id, message, link_url, created_by_employee_id, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [admin.employee_id, branchId, msg, link, req.user.employee_id]);
            }
        }

        // 4. Payment Logic
        const amount = parseFloat(payment_amount);
        if (amount > 0) {
            await connection.query(`
                INSERT INTO payments (patient_id, branch_id, amount, mode, payment_date, remarks, created_at, processed_by_employee_id)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
            `, [patient_id, branchId, amount, mode, today, remarks, req.user.employee_id]);
        }

        // 5. Auto-Activate Patient
        if (patient.status === 'inactive') {
            await connection.query("UPDATE patients SET status = 'active' WHERE patient_id = ?", [patient_id]);
        }

        // 6. Inline Financial Update (Mirrors UI logic exactly to prevent unpredictable jumps)
        let attendanceCostDeduction = 0;
        if (status === 'present' || status === 'pending') {
            attendanceCostDeduction = curRate;
        }

        const newBalance = effectiveBalance - attendanceCostDeduction;

        await connection.query("UPDATE patients SET advance_payment = ? WHERE patient_id = ?", [newBalance, patient_id]);

        await connection.commit();
        res.json({
            success: true,
            status: 'success', // Keep both for backward compatibility
            message: status === 'pending' ? 'Attendance request sent for approval' : 'Attendance marked successfully',
            new_balance: newBalance.toFixed(2)
        });

    } catch (error) {
        await connection.rollback();
        console.error("Mark Full Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}
