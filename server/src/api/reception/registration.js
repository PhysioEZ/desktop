const fs = require('fs');
const path = require('path');
const sqlite = require('../../config/sqlite');
const DbService = require('../../services/DbService');

exports.submitRegistration = async (req, res) => {
    try {
        const data = req.body;
        const branch_id = req.user.branch_id || data.branch_id;
        const employee_id = req.user.employee_id || data.employee_id;

        if (!branch_id || !employee_id) {
            return res.status(400).json({ success: false, message: 'Branch ID and Employee ID required' });
        }

        // --- 1. Collect and Sanitize Inputs ---
        const patient_name = (data.patient_name || '').trim();
        const phone = (data.phone || '').trim();
        const email = (data.email || '').trim();
        const gender = data.gender || '';
        const age = (data.age || '').trim();

        let chief_complain = '';
        const conditionType = data.conditionType;
        if (Array.isArray(conditionType)) {
            chief_complain = conditionType.join(', ');
        } else {
            chief_complain = conditionType || 'other';
        }

        const referralSource = data.referralSource || 'self';
        const referred_by = (data.referred_by || '').trim();
        const occupation = (data.occupation || '').trim();
        const address = (data.address || '').trim();
        const consultation_type = data.inquiry_type || 'in-clinic';
        const appointment_date = data.appointment_date || null;
        const appointment_time = data.appointment_time || null;
        const consultation_amt = parseFloat(data.amount || 0);
        const payment_method = data.payment_method || 'cash';
        const remarks = (data.remarks || '').trim();

        if (!patient_name || !phone || !gender || !age) {
            throw new Error("Please fill in all required fields.");
        }

        // --- 2. Generate Unique Patient UID (Simplified for local) ---
        const todayStr = new Date().toISOString().split('T')[0];
        const ymd = todayStr.replace(/-/g, '').slice(2); // YYMMDD
        const patientUID = `${ymd}${Math.floor(Math.random() * 10000)}`;

        // --- 3. Execute in Transaction ---
        let newRegistrationId = null;

        const transaction = sqlite.transaction(() => {
            // Check existing patient
            const existing = sqlite.prepare("SELECT master_patient_id FROM patient_master WHERE phone_number = ? LIMIT 1").get(phone);
            let masterPatientId = existing ? existing.master_patient_id : null;

            if (!masterPatientId) {
                const res = sqlite.prepare(`
                    INSERT INTO patient_master (patient_uid, full_name, phone_number, gender, age, first_registered_branch_id, _sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, 'pending')
                `).run(patientUID, patient_name, phone, gender, age, branch_id);
                masterPatientId = res.lastInsertRowid;
            }

            const approval_status = (consultation_amt <= 0) ? 'pending' : 'approved';

            const regRes = sqlite.prepare(`
                INSERT INTO registration 
                (master_patient_id, branch_id, created_by_employee_id, patient_name, phone_number, email, gender, age, chief_complain, referralSource, reffered_by, occupation, address, consultation_type, appointment_date, appointment_time, consultation_amount, payment_method, remarks, status, approval_status, _sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 'pending')
            `).run(
                masterPatientId, branch_id, employee_id, patient_name, phone, email, gender, age,
                chief_complain, referralSource, referred_by, occupation, address, consultation_type,
                appointment_date, appointment_time, consultation_amt, payment_method, remarks, approval_status
            );

            newRegistrationId = regRes.lastInsertRowid;
        });

        transaction();

        res.json({
            success: true,
            message: "Patient registered locally! Syncing with server...",
            patient_uid: patientUID,
            registration_id: newRegistrationId
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.quickAddPatient = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const input = req.body;
        const branchId = req.user.branch_id || 0;
        const employeeId = req.user.employee_id || 0;

        if (!branchId || !employeeId) {
            throw new Error('Branch ID or Employee ID missing from session');
        }

        const registrationId = input.registrationId || null;
        const serviceTrackId = input.serviceTrackId || null;
        const serviceType = input.serviceType || 'physio';
        let treatmentType = input.treatmentType || null;

        // Resolve plan name if it's an ID
        if (serviceTrackId && treatmentType) {
            const [rows] = await connection.query("SELECT pricing FROM service_tracks WHERE id = ?", [serviceTrackId]);
            if (rows.length > 0) {
                const pricing = typeof rows[0].pricing === 'string' ? JSON.parse(rows[0].pricing) : rows[0].pricing;
                const plan = pricing.plans?.find(pl => String(pl.id) === String(treatmentType));
                if (plan) treatmentType = plan.name;
            }
        }

        const treatmentDays = parseInt(input.treatmentDays) || 0;
        const totalAmount = parseFloat(input.totalCost || 0);
        const advancePayment = parseFloat(input.advancePayment || 0);
        const discountInput = parseFloat(input.discount || 0);
        const dueAmount = parseFloat(input.dueAmount || 0);
        const startDate = input.startDate || null;
        const paymentMethodString = input.paymentMethod || 'Cash';
        const timeSlot = input.treatment_time_slot || null;
        const discountApprovedBy = input.discount_approved_by_employee_id || null;
        const customFields = input.customFields ? JSON.stringify(input.customFields) : null;

        if (!registrationId || !treatmentType || !startDate || !timeSlot) {
            throw new Error('Missing required fields: registrationId, treatmentType, startDate, and timeSlot are mandatory.');
        }

        // Fallback for generic 'fixed' or 'package' strings to be more descriptive
        if (treatmentType === 'fixed' || treatmentType === 'package') {
            treatmentType = serviceType.toLowerCase();
        }

        // Get master_patient_id
        const [regRows] = await connection.query("SELECT master_patient_id FROM registration WHERE registration_id = ?", [registrationId]);
        if (regRows.length === 0) {
            throw new Error("Registration not found.");
        }
        const masterPatientId = regRows[0].master_patient_id;

        // Check for duplicates
        const [dupRows] = await connection.query("SELECT patient_id FROM patients WHERE registration_id = ? AND service_type = ?", [registrationId, serviceType]);
        if (dupRows.length > 0) {
            throw new Error(`This registration has already been converted to a ${serviceType} patient.`);
        }

        // Calculate end date
        let endDate = null;
        if (startDate && treatmentDays > 0) {
            const dt = new Date(startDate);
            dt.setDate(dt.getDate() + (treatmentDays - 1));
            endDate = dt.toISOString().split('T')[0];
        }

        const treatmentCostPerDay = treatmentDays > 0 ? totalAmount / treatmentDays : null;
        const packageCost = treatmentDays === 0 ? totalAmount : null;

        // Calculate total discount amount correctly based on source form type
        let discountAmount = 0;
        if (input.isDynamic) {
            // In DynamicServiceModal, discount is ₹/Day
            discountAmount = treatmentDays > 0 ? (discountInput * treatmentDays) : discountInput;
        } else {
            // In legacy QuickAddModal, discount is percentage (e.g. 10 for 10%)
            if (discountInput > 0 && discountInput < 100) {
                // net = gross * (1 - p/100) => gross = net / (1 - p/100)
                const gross = totalAmount / (1 - (discountInput / 100));
                discountAmount = gross - totalAmount;
            } else if (discountInput >= 100) {
                // If 100% discount, then it's a bit tricky since totalAmount is 0
                // We just record it as 0 for now as we don't have subtotal here,
                // but this case is rare.
                discountAmount = 0;
            }
        }

        // Insert Patient
        const [ptResult] = await connection.query(`
            INSERT INTO patients (
                registration_id, service_track_id, branch_id, master_patient_id, created_by_employee_id, 
                treatment_type, service_type, treatment_cost_per_day, package_cost, 
                treatment_days, total_amount, payment_method, 
                discount_amount, discount_approved_by_employee_id, discount_approved_by,
                advance_payment, due_amount, start_date, end_date, treatment_time_slot, 
                custom_fields, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            registrationId, serviceTrackId, branchId, masterPatientId, employeeId,
            treatmentType, serviceType, treatmentCostPerDay, packageCost,
            treatmentDays, totalAmount, paymentMethodString,
            discountAmount, discountApprovedBy || null, discountApprovedBy || null,
            advancePayment, dueAmount, startDate, endDate, timeSlot,
            customFields
        ]);

        const newPatientId = ptResult.insertId;

        // Generate Appointments
        if (treatmentDays > 0) {
            const currDate = new Date(startDate);
            for (let i = 0; i < treatmentDays; i++) {
                const dateStr = currDate.toISOString().split('T')[0];
                await connection.query(`
                    INSERT INTO patient_appointments (patient_id, branch_id, created_by_employee_id, appointment_date, time_slot, service_type, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
                `, [newPatientId, branchId, employeeId, dateStr, timeSlot, serviceType]);
                currDate.setDate(currDate.getDate() + 1);
            }
        }

        // Record Payment
        if (advancePayment > 0) {
            const [pResult] = await connection.query(`
                INSERT INTO payments (patient_id, branch_id, payment_date, amount, mode, remarks, processed_by_employee_id)
                VALUES (?, ?, ?, ?, ?, 'Initial advance payment', ?)
            `, [newPatientId, branchId, startDate, advancePayment, paymentMethodString, employeeId]);
            const newPaymentId = pResult.insertId;

            // Handle splits
            const paymentSplits = input.paymentSplits || [];
            if (Array.isArray(paymentSplits)) {
                for (const split of paymentSplits) {
                    if (split.method && parseFloat(split.amount) > 0) {
                        await connection.query(`INSERT INTO payment_splits (payment_id, payment_method, amount) VALUES (?, ?, ?)`, [newPaymentId, split.method, parseFloat(split.amount)]);
                    }
                }
            }
        }

        // Update Registration Status
        await connection.query("UPDATE registration SET status = 'consulted' WHERE registration_id = ?", [registrationId]);

        await connection.commit();
        res.json({ status: 'success', message: 'Patient added successfully', patient_id: newPatientId });

    } catch (error) {
        await connection.rollback();
        console.error("Quick Add Patient Error:", error);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

