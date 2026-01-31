const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

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
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Upsert counter
        await connection.query(`
            INSERT INTO daily_patient_counter (entry_date, counter) VALUES (?, 1)
            ON DUPLICATE KEY UPDATE counter = counter + 1
        `, [today]);

        const [counterRows] = await connection.query("SELECT counter FROM daily_patient_counter WHERE entry_date = ?", [today]);
        const serialNumber = counterRows[0].counter;

        // Format: YYMMDD + counter
        const dateObj = new Date();
        const ymd = dateObj.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
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
                        const uploadDir = path.join(__dirname, '../../../uploads/patient_photos');
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
