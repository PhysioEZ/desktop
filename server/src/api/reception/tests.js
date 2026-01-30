const pool = require('../../config/db');

exports.submitTest = async (req, res) => {
    const data = req.body;
    const branch_id = req.user.branch_id || data.branch_id;
    const employee_id = req.user.employee_id || data.employee_id;

    if (!branch_id || !employee_id) {
        return res.status(400).json({ success: false, message: 'Branch ID and Employee ID required' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Collect and Validate Inputs
        const today = new Date().toISOString().split('T')[0];
        const visit_date = data.visit_date || today;
        const assigned_test_date = data.assigned_test_date || today;
        const patient_name = (data.patient_name || '').trim();
        const age = (data.age || '').trim();
        const gender = data.gender || '';

        // Optional fields
        const dob = data.dob || null;
        const parents = (data.parents || '').trim() || null;
        const relation = (data.relation || '').trim() || null;
        const phone_number = (data.phone_number || '').trim();
        const alternate_phone_no = (data.alternate_phone_no || '').trim() || null;
        const address = (data.address || '').trim() || null;
        const referred_by = (data.referred_by || '').trim() || null;
        const limb = data.limb || null;
        const test_done_by = data.test_done_by || '';

        // Test names and amounts
        let test_names = data.test_names || [];
        // test_amounts might come as an object { "TestName": "100" } or array logic in JS
        // In PHP it was $data['test_amounts']. JS req.body parses JSON.
        let test_amounts = data.test_amounts || {};

        // Validation
        if (!patient_name || !gender || !age) {
            throw new Error('Required fields missing: Patient Name, Gender, Age.');
        }
        if (!test_names || test_names.length === 0) {
            throw new Error('Please select at least one test.');
        }

        // Handle "Other" test name
        if (test_names.includes('other')) {
            const other_name = (data.other_test_name || '').trim();
            if (other_name) {
                // Replace 'other' with actual name
                const idx = test_names.indexOf('other');
                if (idx !== -1) test_names[idx] = other_name;

                // Move amount from 'other' to new name
                if (test_amounts['other']) {
                    test_amounts[other_name] = test_amounts['other'];
                    delete test_amounts['other'];
                }
            } else {
                throw new Error('Please specify the name for the "Other" test.');
            }
        }

        // Financials
        const total_amount = parseFloat(data.total_amount || 0);
        const advance_amount = parseFloat(data.advance_amount || 0);
        const discount = parseFloat(data.discount || 0);
        const payment_method = data.payment_method || 'cash';

        // 2. Generate Test UID
        // Format: YYMMDD + serial (2 digits)
        // Need to parse visit_date to YYMMDD
        // visit_date is YYYY-MM-DD
        const dateObj = new Date(visit_date);
        const ymd = dateObj.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const datePrefix = ymd;

        const [lastUidRows] = await connection.query(`
            SELECT test_uid FROM tests 
            WHERE test_uid LIKE ? 
            ORDER BY test_uid DESC 
            LIMIT 1
        `, [datePrefix + '%']);

        let serial = 0;
        if (lastUidRows.length > 0) {
            const lastUid = lastUidRows[0].test_uid;
            // lastUid format YYMMDDXX
            const suffix = lastUid.substring(6);
            serial = parseInt(suffix, 10) || 0;
        }
        serial++;
        const newTestUid = datePrefix + String(serial).padStart(2, '0');

        // 3. Calculate Global Totals and Status
        let global_total_amount = 0.00;
        test_names.forEach(name => {
            const amt = parseFloat(test_amounts[name] || 0);
            global_total_amount += amt;
        });

        // Ensure global_total_amount matches passed total (sanity check? or override?)
        // PHP code calculated it from test_amounts logic. Let's trust logic.

        const global_due_amount = global_total_amount - advance_amount - discount;

        let global_payment_status = 'pending';
        if (global_total_amount === 0) {
            global_payment_status = 'paid';
        } else if (global_due_amount <= 0 && global_total_amount > 0) {
            global_payment_status = 'paid';
        } else if (advance_amount > 0 && global_due_amount > 0) {
            global_payment_status = 'partial';
        }

        // Approval Status
        const approval_status = (advance_amount <= 0 || discount > 200) ? 'pending' : 'approved';

        // 4. Insert Parent Record
        const parent_test_name = test_names.map(t => t.toUpperCase()).join(', ');

        const [parentResult] = await connection.query(`
            INSERT INTO tests (
                test_uid, visit_date, assigned_test_date, patient_name, phone_number,
                gender, age, dob, parents, relation, alternate_phone_no, address,
                limb, test_name, referred_by, test_done_by, created_by_employee_id,
                total_amount, advance_amount, discount, due_amount, payment_method,
                payment_status, branch_id, approval_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            newTestUid, visit_date, assigned_test_date, patient_name, phone_number,
            gender, age, dob, parents, relation, alternate_phone_no, address,
            limb, parent_test_name, referred_by, test_done_by, employee_id,
            global_total_amount, advance_amount, discount, Math.max(0, global_due_amount), payment_method,
            global_payment_status, branch_id, approval_status
        ]);

        const parent_test_id = parentResult.insertId;

        // 5. Insert Payment Splits
        const payment_amounts_split = data.payment_amounts || {};
        // Note: data.payment_amounts might be the split {cash: 100, online: 200}
        // Be careful not to confuse with test_amounts (amounts per test)
        // Usually frontend sends: payment_amounts: {cash: 100}, test_amounts: {Xray:500}

        for (const [method, amt] of Object.entries(payment_amounts_split)) {
            const val = parseFloat(amt);
            if (val > 0) {
                await connection.query(
                    "INSERT INTO test_payments (test_id, payment_method, amount) VALUES (?, ?, ?)",
                    [parent_test_id, method, val]
                );
            }
        }

        // 6. Insert Child Items
        let remaining_advance = advance_amount;
        let remaining_discount = discount;

        for (const single_test_name of test_names) {
            const current_total_amount = parseFloat(test_amounts[single_test_name] || 0);

            // Distribute advance
            let current_advance_amount = 0.00;
            if (remaining_advance > 0) {
                if (remaining_advance >= current_total_amount) {
                    current_advance_amount = current_total_amount;
                    remaining_advance -= current_total_amount;
                } else {
                    current_advance_amount = remaining_advance;
                    remaining_advance = 0;
                }
            }

            // Distribute discount
            let current_discount_amount = 0.00;
            if (remaining_discount > 0) {
                const max_discount = Math.max(0, current_total_amount - current_advance_amount);
                if (remaining_discount >= max_discount) {
                    current_discount_amount = max_discount;
                    remaining_discount -= max_discount;
                } else {
                    current_discount_amount = remaining_discount;
                    remaining_discount = 0;
                }
            }

            const current_due_amount = current_total_amount - current_advance_amount - current_discount_amount;

            let current_payment_status = 'pending';
            if (current_total_amount === 0) current_payment_status = 'paid';
            else if (current_due_amount <= 0) current_payment_status = 'paid';
            else if (current_advance_amount > 0) current_payment_status = 'partial';

            const [itemResult] = await connection.query(`
                INSERT INTO test_items (
                    test_id, created_by_employee_id, assigned_test_date, test_name,
                    limb, referred_by, test_done_by, total_amount, advance_amount, discount,
                    due_amount, payment_method, test_status, payment_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
            `, [
                parent_test_id, employee_id, assigned_test_date, single_test_name,
                limb, referred_by, test_done_by, current_total_amount, current_advance_amount, current_discount_amount,
                Math.max(0, current_due_amount), payment_method, current_payment_status
            ]);

            const newItemId = itemResult.insertId;

            // 7. Referral Logic
            if (referred_by) {
                const [pRules] = await connection.query("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1", [referred_by]);
                if (pRules.length > 0) {
                    const pId = pRules[0].partner_id;

                    // Update parent and child
                    await connection.query("UPDATE tests SET referral_partner_id = ? WHERE test_id = ?", [pId, parent_test_id]);
                    await connection.query("UPDATE test_items SET referral_partner_id = ? WHERE item_id = ?", [pId, newItemId]);

                    // Calculate Commission
                    const [rateRows] = await connection.query(
                        "SELECT commission_amount FROM referral_rates WHERE partner_id = ? AND service_type = 'test' AND service_item_name = ? LIMIT 1",
                        [pId, single_test_name]
                    );

                    if (rateRows.length > 0) {
                        const commAmt = rateRows[0].commission_amount;
                        await connection.query("UPDATE test_items SET commission_amount = ? WHERE item_id = ?", [commAmt, newItemId]);
                    }
                }
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Test record added successfully with UID: " + newTestUid,
            test_uid: newTestUid,
            test_id: parent_test_id
        });

    } catch (error) {
        await connection.rollback();
        console.error("Submit Test Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.addTestForPatient = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const input = req.body;
        const patientId = input.test_patient_id || null;
        const total = parseFloat(input.total_amount || 0);
        const advance = parseFloat(input.advance_amount || 0);
        const due = parseFloat(input.due_amount || 0);

        if (!patientId) {
            throw new Error('Patient ID required');
        }

        // 1. Fetch Patient Info
        const [ptRows] = await connection.query("SELECT * FROM patients WHERE patient_id = ?", [patientId]);
        const patient = ptRows[0];
        if (!patient) throw new Error("Patient not found");

        // 2. Generate UID
        const today = new Date().toISOString().split('T')[0];
        const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const [lastUidRows] = await connection.query("SELECT test_uid FROM tests WHERE test_uid LIKE ? ORDER BY test_uid DESC LIMIT 1", [datePrefix + '%']);
        const lastUid = lastUidRows.length > 0 ? lastUidRows[0].test_uid : null;
        let serial = lastUid ? parseInt(lastUid.substring(6)) : 0;
        serial++;
        const newTestUid = datePrefix + String(serial).padStart(2, '0');

        // 3. Insert into tests
        const status = (due <= 0) ? 'paid' : ((advance > 0) ? 'partial' : 'pending');

        const [testResult] = await connection.query(`
            INSERT INTO tests (
                test_uid, visit_date, assigned_test_date, patient_name, phone_number,
                gender, age, test_name, total_amount, advance_amount, due_amount, 
                payment_status, branch_id, approval_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'General Test (Patient Module)', ?, ?, ?, ?, ?, 'approved')
        `, [
            newTestUid, today, today, patient.patient_name || 'N/A', patient.patient_phone || 'N/A',
            patient.patient_gender || 'N/A', patient.patient_age || 'N/A',
            total, advance, due, status, patient.branch_id
        ]);

        const testId = testResult.insertId;

        // 4. Insert into test_items
        await connection.query(`
            INSERT INTO test_items (
                test_id, test_name, total_amount, advance_amount, due_amount, payment_status, created_at
            ) VALUES (?, 'General Test', ?, ?, ?, ?, NOW())
        `, [testId, total, advance, due, status]);

        // 5. Insert into payments
        if (advance > 0) {
            await connection.query(`
                INSERT INTO payments (patient_id, amount, payment_method, mode, payment_date, remarks, branch_id, created_at, processed_by_employee_id)
                VALUES (?, ?, 'Cash', 'Cash', ?, 'Test Advance', ?, NOW(), ?)
            `, [patientId, advance, today, patient.branch_id, req.user.employee_id]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Test added successfully' });

    } catch (error) {
        await connection.rollback();
        console.error("Add Test For Patient Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

