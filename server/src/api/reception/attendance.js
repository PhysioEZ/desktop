const pool = require('../../config/db');

exports.handleAttendanceRequest = async (req, res) => {
    try {
        const input = req.body;
        const action = input.action || 'mark'; // 'mark' for simple, or 'add' for full logic if needed
        const branchId = req.user.branch_id || input.branch_id;

        if (!branchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });

        // If it's the full addLog (from add_attendance.php)
        if (req.method === 'POST') {
            await markFullAttendance(req, res, branchId, input);
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid method' });
        }
    } catch (error) {
        console.error("Attendance Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

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

        const [paidRows] = await connection.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ?", [patient_id]);
        const totalPaidSoFar = parseFloat(paidRows[0].total || 0);

        const [histRows] = await connection.query("SELECT COALESCE(SUM(consumed_amount), 0) as total FROM patients_treatment WHERE patient_id = ?", [patient_id]);
        const historyConsumed = parseFloat(histRows[0].total || 0);

        const curRate = (patient.treatment_type === 'package' && patient.treatment_days > 0)
            ? (parseFloat(patient.package_cost) / patient.treatment_days)
            : parseFloat(patient.treatment_cost_per_day || 0);

        const [cAttRows] = await connection.query("SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'", [patient_id, patient.start_date || '2000-01-01']);
        const currentAttendanceCount = cAttRows[0].count;

        const currentConsumed = currentAttendanceCount * curRate;
        const totalPaidWithNew = totalPaidSoFar + parseFloat(payment_amount);
        const effectiveBalance = totalPaidWithNew - (historyConsumed + currentConsumed);

        // 2. Financial Validation
        // If they are marking 'present' and they have no balance to cover THIS visit
        if (status === 'present') {
            const today = new Date().toISOString().split('T')[0];
            const [alreadyMarked] = await connection.query("SELECT attendance_id FROM attendance WHERE patient_id = ? AND attendance_date = ? AND status = 'present'", [patient_id, today]);

            // If they weren't already marked present today, this visit will cost 'curRate'
            // Relaxed check: Compare values in paisa/cents to avoid floating point issues
            if (alreadyMarked.length === 0 && Math.round(effectiveBalance * 100) < Math.round(curRate * 100)) {
                // If it's a package and they still have days left, we might allow it? 
                // No, in this system, the balance must be sufficient regardless of package/daily if it's strictly wallet based.
                // However, usually packages are paid upfront. If effectiveBalance < curRate, they are essentially in debt.
                return res.status(403).json({
                    success: false,
                    message: `Insufficient Balance. Current: ${effectiveBalance.toFixed(2)}, Session Cost: ${curRate.toFixed(2)}. Please collect payment first.`,
                    balance: effectiveBalance
                });
            }
        }

        // 3. Attendance Logic
        const today = new Date().toISOString().split('T')[0];
        const [existing] = await connection.query("SELECT attendance_id FROM attendance WHERE patient_id = ? AND attendance_date = ?", [patient_id, today]);

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
                INSERT INTO payments (patient_id, amount, mode, payment_date, remarks, created_at, processed_by_employee_id)
                VALUES (?, ?, ?, ?, ?, NOW(), ?)
            `, [patient_id, amount, mode, today, remarks, req.user.employee_id]);
        }

        // 5. Auto-Activate Patient
        if (patient.status === 'inactive') {
            await connection.query("UPDATE patients SET status = 'active' WHERE patient_id = ?", [patient_id]);
        }

        await connection.commit();
        res.json({
            success: true,
            message: status === 'pending' ? 'Attendance request sent for approval' : 'Attendance marked successfully',
            new_balance: (effectiveBalance - (status === 'present' ? curRate : 0)).toFixed(2)
        });

    } catch (error) {
        await connection.rollback();
        console.error("Mark Full Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}
