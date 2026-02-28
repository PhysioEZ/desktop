const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');
const { recalculatePatientFinancials } = require('../../utils/financials');

exports.submitRegistration = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

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

        // Handle Chief Complaint
        let chief_complain = '';
        const conditionType = data.conditionType;
        if (Array.isArray(conditionType)) {
            const complaints = conditionType.filter(c => c !== 'other');
            if (conditionType.includes('other') && data.conditionType_other) {
                complaints.push(data.conditionType_other.trim());
            }
            chief_complain = complaints.join(', ');
        } else {
            chief_complain = (conditionType === 'other' && data.conditionType_other)
                ? data.conditionType_other
                : (conditionType || 'other');
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

        // Validation
        if (!patient_name || !phone || !gender || !age) {
            throw new Error("Please fill in all required fields: Name, Phone, Gender, and Age.");
        }

        // --- 2. Generate Unique Patient UID ---
        const istNow = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
        const today = istNow.toISOString().split('T')[0]; // YYYY-MM-DD

        // Upsert counter (MySQL/MariaDB standard)
        await connection.query(`
            INSERT INTO daily_patient_counter (entry_date, counter) VALUES (?, 1)
            ON DUPLICATE KEY UPDATE counter = counter + 1
        `, [today]);

        const [counterRows] = await connection.query("SELECT counter FROM daily_patient_counter WHERE entry_date = ?", [today]);
        const serialNumber = counterRows[0].counter;

        // Format: YYMMDD + counter
        const ymd = istNow.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const patientUID = `${ymd}${serialNumber}`;

        // --- 3. Check/Upsert Patient Master ---
        let masterPatientId = null;
        const [existingPatient] = await connection.query("SELECT master_patient_id FROM patient_master WHERE phone_number = ? LIMIT 1", [phone]);

        if (existingPatient.length > 0) {
            masterPatientId = existingPatient[0].master_patient_id;
        } else {
            const [newPatient] = await connection.query(`
                INSERT INTO patient_master (patient_uid, full_name, phone_number, gender, age, first_registered_branch_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [patientUID, patient_name, phone, gender, age, branch_id]);
            masterPatientId = newPatient.insertId;
        }

        // Approval Status
        const approval_status = (consultation_amt <= 0) ? 'pending' : 'approved';

        // --- 4. Insert Registration ---
        const [regResult] = await connection.query(`
            INSERT INTO registration 
            (master_patient_id, branch_id, created_by_employee_id, patient_name, phone_number, email, gender, age, chief_complain, referralSource, reffered_by, occupation, address, consultation_type, appointment_date, appointment_time, consultation_amount, payment_method, remarks, status, approval_status)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        `, [
            masterPatientId, branch_id, employee_id, patient_name, phone, email, gender, age,
            chief_complain, referralSource, referred_by, occupation, address, consultation_type,
            appointment_date, appointment_time, consultation_amt, payment_method, remarks, approval_status
        ]);

        const newRegistrationId = regResult.insertId;

        // --- 5. Handle Payment Breakdown ---
        const paymentAmounts = data.payment_amounts;
        if (paymentAmounts && typeof paymentAmounts === 'object') {
            for (const [method, amt] of Object.entries(paymentAmounts)) {
                if (parseFloat(amt) > 0) {
                    await connection.query(`
                        INSERT INTO registration_payments (registration_id, payment_method, amount, branch_id) VALUES (?, ?, ?, ?)
                    `, [newRegistrationId, method, parseFloat(amt), branch_id]);
                }
            }
        }

        // --- 6. Referral Partner Logic ---
        if (referred_by) {
            const [pRows] = await connection.query("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1", [referred_by]);
            if (pRows.length > 0) {
                const pId = pRows[0].partner_id;
                await connection.query("UPDATE registration SET referral_partner_id = ? WHERE registration_id = ?", [pId, newRegistrationId]);

                const [rateRows] = await connection.query("SELECT commission_amount FROM referral_rates WHERE partner_id = ? AND service_type = 'registration' LIMIT 1", [pId]);
                if (rateRows.length > 0) {
                    await connection.query("UPDATE registration SET commission_amount = ? WHERE registration_id = ?", [rateRows[0].commission_amount, newRegistrationId]);
                }
            }
        }

        // --- 7. Handle Patient Photo ---
        if (data.patient_photo_data) {
            try {
                const imageData = data.patient_photo_data;
                const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);

                if (matches) {
                    const type = matches[1].toLowerCase();
                    const buffer = Buffer.from(matches[2], 'base64');

                    if (['jpg', 'jpeg', 'gif', 'png'].includes(type)) {
                        const uploadDir = path.join(__dirname, '../../uploads/patient_photos');
                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }

                        const fileName = `reg_${newRegistrationId}_${Date.now()}.${type}`;
                        const filePath = path.join(uploadDir, fileName);

                        fs.writeFileSync(filePath, buffer);

                        // Relative path for DB (matching public structure)
                        const relativePath = 'uploads/patient_photos/' + fileName;
                        await connection.query("UPDATE registration SET patient_photo_path = ? WHERE registration_id = ?", [relativePath, newRegistrationId]);
                    }
                }
            } catch (err) {
                console.error("Photo upload failed:", err);
                // Continue without failing the registration
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Patient registered successfully!",
            patient_uid: patientUID,
            registration_id: newRegistrationId
        });

    } catch (error) {
        await connection.rollback();
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
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

        // Centralized Recalculation
        await recalculatePatientFinancials(connection, newPatientId);

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

