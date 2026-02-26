const pool = require('../../config/db');
const { recalculatePatientFinancials } = require('../../utils/financials');


exports.handleTreatmentPlanRequest = async (req, res) => {
    const input = { ...req.query, ...req.body };
    const action = input.action || 'fetch_tracks';
    const branchId = req.user.branch_id || input.branch_id;

    if (!branchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });

    try {
        switch (action) {
            case 'fetch_tracks':
                await fetchServiceTracks(req, res);
                break;
            case 'edit_plan':
                await editTreatmentPlan(req, res, input);
                break;
            case 'change_plan':
                await changeTreatmentPlan(req, res, input);
                break;
            default:
                res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Treatment Plan Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Fetch active service tracks to avoid hardcoding "Daily/Package"
 */
async function fetchServiceTracks(req, res) {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, button_label as label, icon, theme_color, pricing, fields FROM service_tracks WHERE is_active = 1"
        );

        const tracks = rows.map(track => ({
            ...track,
            pricing: typeof track.pricing === 'string' ? JSON.parse(track.pricing) : track.pricing,
            fields: typeof track.fields === 'string' ? JSON.parse(track.fields) : track.fields
        }));

        res.json({ status: 'success', data: tracks });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function editTreatmentPlan(req, res, input) {
    const patientId = input.edit_plan_patient_id || input.patient_id;
    if (!patientId) return res.status(400).json({ success: false, message: 'Patient ID required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Fetch CURRENT state for calculations
        const [rows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patientId]);
        const patient = rows[0];
        if (!patient) throw new Error("Patient not found");

        const mapping = {
            'edit_treatment_days': 'treatment_days',
            'edit_time_slot': 'treatment_time_slot',
            'edit_start_date': 'start_date',
            'edit_end_date': 'end_date',
            'edit_assigned_doctor': 'assigned_doctor',
            'edit_discount_percentage': 'discount_percentage'
        };

        const fields = [];
        const params = [];

        for (const [key, col] of Object.entries(mapping)) {
            if (input[key] !== undefined) {
                fields.push(`${col} = ?`);
                params.push(input[key]);
            }
        }

        if (input.edit_remarks) {
            fields.push("remarks = CONCAT(COALESCE(remarks, ''), ?)");
            params.push(`\n[Edit: ${input.edit_remarks}]`);
        }


        // 2. Financial Recalculation
        // If days, discount, or amount changed, we must update total_amount
        const needsTotalRecalc = input.edit_treatment_days !== undefined || input.edit_discount_percentage !== undefined || input.edit_total_amount !== undefined;

        if (needsTotalRecalc) {
            const newDays = parseInt(input.edit_treatment_days !== undefined ? input.edit_treatment_days : patient.treatment_days) || 0;
            const newDiscPct = parseFloat(input.edit_discount_percentage !== undefined ? input.edit_discount_percentage : patient.discount_percentage) || 0;

            // Logic:
            // If user provides a specific Total Amount, we rely on that (and reverse calc rate).
            // If not, we calc Total from Rate * Days.

            let totalAmount = 0;
            let packageCost = 0;
            let costPerDay = 0;

            // Scenario A: User manually edited total (overrides rate logic)
            if (input.edit_total_amount !== undefined) {
                totalAmount = parseFloat(input.edit_total_amount);
                // If days > 0, rate is total / days
                if (newDays > 0) {
                    costPerDay = totalAmount / newDays;
                }
                packageCost = totalAmount; // For package, cost is total
            }
            // Scenario B: User edited Days/Discount, preserving existing Rate structure
            else {
                // Get base rate (undiscounted)
                // If it was package, implicit rate was package_cost/days
                // If it was daily, it's treatment_cost_per_day
                // We typically want to maintain the "Daily Rate" if we are extending days.

                let basePerDay = parseFloat(patient.treatment_cost_per_day || 0);
                if (patient.treatment_type === 'package' && patient.treatment_days > 0) {
                    basePerDay = parseFloat(patient.package_cost) / patient.treatment_days;
                }

                const subtotal = basePerDay * newDays;
                const discountAmount = (subtotal * newDiscPct) / 100;
                totalAmount = subtotal - discountAmount;
                packageCost = (newDays > 1) ? subtotal : 0; // package cost usually implies gross amount before discount? Checking registration.js... 
                // In registration.js: packageCost = treatmentDays === 0 ? totalAmount : null; Wait, logic varies.
                // Let's stick to: package_cost is the GROSS amount for the package.
                packageCost = subtotal;
                costPerDay = basePerDay;
            }

            const discountAmountValue = (packageCost * newDiscPct) / 100; // Recalculate discount value
            const netRate = newDays > 0 ? (totalAmount / newDays) : 0;

            fields.push("total_amount = ?", "discount_amount = ?", "package_cost = ?", "treatment_cost_per_day = ?");
            params.push(totalAmount, discountAmountValue, packageCost, netRate);
        }

        if (fields.length > 0) {
            params.push(patientId);
            const sql = `UPDATE patients SET ${fields.join(", ")} WHERE patient_id = ?`;
            await connection.query(sql, params);
        }

        // 3. Centralized Recalculation (Fixes unit cost & dues)
        await recalculatePatientFinancials(connection, patientId);

        await connection.commit();
        res.json({ success: true, message: 'Plan updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error("Edit Plan Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
}

async function changeTreatmentPlan(req, res, input) {
    const patientId = input.old_patient_id || input.patient_id;
    const trackId = input.new_track_id; // Added trackId for dynamic selection

    if (!patientId) return res.status(400).json({ success: false, message: 'Patient ID required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Fetch current patient state
        const [ptRows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patientId]);
        const patient = ptRows[0];
        if (!patient) throw new Error("Patient not found");

        // 2. Fetch track info if trackId provided (Dynamic Logic)
        let trackData = null;
        if (trackId) {
            const [tRows] = await connection.query("SELECT * FROM service_tracks WHERE id = ?", [trackId]);
            if (tRows.length > 0) {
                trackData = tRows[0];
                trackData.pricing = typeof trackData.pricing === 'string' ? JSON.parse(trackData.pricing) : trackData.pricing;
            }
        }

        // 3. Archive Current Plan to History
        const actualEndDate = new Date().toISOString().split('T')[0];

        // We reuse the effective balance calculation logic or assume the caller passed it
        // Better to calculate it here to ensure data integrity
        const [paidRows] = await connection.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE patient_id = ?", [patientId]);
        const totalPaid = parseFloat(paidRows[0].total || 0);

        // Optimized History Consumption
        const [histRows] = await connection.query("SELECT COALESCE(SUM(consumed_amount), 0) as total FROM patients_treatment WHERE patient_id = ?", [patientId]);
        const historyConsumed = parseFloat(histRows[0].total || 0);

        const curRate = (patient.treatment_type === 'package' && patient.treatment_days > 0) ? (parseFloat(patient.package_cost) / patient.treatment_days) : parseFloat(patient.treatment_cost_per_day || 0);
        const [cAtt] = await connection.query("SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < CURDATE() AND status = 'present'", [patientId, patient.start_date || '2000-01-01']);
        const currentCount = cAtt[0].count;
        const currentConsumed = (currentCount * curRate);

        const totalConsumed = historyConsumed + currentConsumed;
        const carryOverBalance = totalPaid - totalConsumed;

        await connection.query(`
            INSERT INTO patients_treatment (
                patient_id, treatment_type, start_date, end_date, 
                treatment_days, attendance_count, consumed_amount,
                treatment_cost_per_day, package_cost, total_amount, 
                due_amount, discount_amount, remarks, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            patientId, patient.treatment_type, patient.start_date, actualEndDate,
            patient.treatment_days, currentCount, currentConsumed,
            patient.treatment_cost_per_day || 0, patient.package_cost || 0,
            patient.total_amount || 0, patient.due_amount || 0, patient.discount_amount || 0,
            `Archived on Plan Change. Carried Over Balance: ${carryOverBalance}. Reason: ${input.reason_for_change || 'N/A'}`
        ]);

        // 4. Update with New Plan Details
        // If trackData is present, we use it. Otherwise, fallback to hardcoded (for compatibility during transition)
        let newType = input.new_treatment_type || 'package';

        // Resolve plan name if it's an ID
        if (trackData && newType) {
            const plan = trackData.pricing?.plans?.find(pl => String(pl.id) === String(newType));
            if (plan) newType = plan.name;
        }
        const newRate = parseFloat(input.new_total_amount || 0);
        const newDays = parseInt(input.new_treatment_days || 0);
        const newDiscountPct = parseFloat(input.new_discount_percentage || 0);
        const advance = parseFloat(input.new_advance_payment || 0);
        const payMethod = input.change_plan_payment_method || 'cash';

        const newStartDate = new Date().toISOString().split('T')[0];
        const newEndDateObj = new Date();
        newEndDateObj.setDate(newEndDateObj.getDate() + newDays);
        const newEndDate = newEndDateObj.toISOString().split('T')[0];

        // Dynamic Cost Logic
        let costPerDay = 0;
        let packageCost = 0;
        let subtotal = 0;

        // Check if the selected plan is a package or daily rate
        const selectedPlan = trackData?.pricing?.plans?.find(p => p.id === newType);

        // Consistent with registration: total = rate * days
        subtotal = newRate * newDays;
        costPerDay = newRate;
        packageCost = (newDays > 1) ? subtotal : 0;

        const discountAmount = (subtotal * newDiscountPct) / 100;
        const totalAmount = subtotal - discountAmount;
        const dueAmount = totalAmount - carryOverBalance - advance;

        await connection.query(`
            UPDATE patients SET
                treatment_type = ?, 
                treatment_days = ?, 
                start_date = ?, 
                end_date = ?,
                treatment_cost_per_day = ?, 
                package_cost = ?, 
                total_amount = ?,
                due_amount = ?,
                discount_amount = ?,
                service_track_id = COALESCE(?, service_track_id),
                status = 'active',
                plan_changed = 1,
                remarks = CONCAT(COALESCE(remarks, ''), ?)
            WHERE patient_id = ?
        `, [
            newType,
            newDays,
            newStartDate,
            newEndDate,
            costPerDay,
            packageCost,
            totalAmount,
            dueAmount,
            discountAmount,
            trackId,
            `\n[Plan Change: ${newType} | New Tot: ${totalAmount} | Days: ${newDays} | Ad: ${advance} | Rsn: ${input.reason_for_change || 'N/A'}]`,
            patientId
        ]);

        // 5. Record Initial Payment (Single or Split)
        const paymentAmounts = input.payment_amounts; // Expecting object { method: amount }

        if (payMethod === 'split' && paymentAmounts && typeof paymentAmounts === 'object') {
            for (const [method, amount] of Object.entries(paymentAmounts)) {
                const amt = parseFloat(amount);
                if (amt > 0) {
                    await connection.query(`
                        INSERT INTO payments (
                            patient_id, branch_id, amount, mode, payment_date, 
                            remarks, created_at, processed_by_employee_id
                        ) VALUES (?, ?, ?, ?, ?, 'Advance for New Plan (Split)', NOW(), ?)
                    `, [
                        patientId,
                        patient.branch_id,
                        amt,
                        method,
                        newStartDate,
                        req.user.employee_id
                    ]);
                }
            }
        } else if (advance > 0) {
            // Fallback to single payment if not split or no split data
            await connection.query(`
                INSERT INTO payments (
                    patient_id, branch_id, amount, mode, payment_date, 
                    remarks, created_at, processed_by_employee_id
                ) VALUES (?, ?, ?, ?, ?, 'Advance for New Plan', NOW(), ?)
            `, [
                patientId,
                patient.branch_id,
                advance,
                payMethod,
                newStartDate,
                req.user.employee_id
            ]);
        }

        // 6. Centralized Recalculation to ensure integrity
        await recalculatePatientFinancials(connection, patientId);

        await connection.commit();
        res.json({
            success: true,
            message: 'Treatment plan changed successfully',
            carried_over: carryOverBalance
        });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
