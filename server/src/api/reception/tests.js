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

        let patient_name = (data.patient_name || '').trim();
        let age = (data.age || '').trim();
        let gender = data.gender || '';
        let phone_number = (data.phone_number || '').trim();

        // If from PatientDetailsModal, we might only get patient_id
        if (data.patient_id && (!patient_name || !age || !gender)) {
            const [ptRows] = await connection.query(
                `SELECT r.patient_name, r.age, r.gender, r.phone_number 
                 FROM patients p
                 JOIN registration r ON p.registration_id = r.registration_id
                 WHERE p.patient_id = ?`,
                [data.patient_id]
            );
            if (ptRows.length > 0) {
                const pt = ptRows[0];
                if (!patient_name) patient_name = (pt.patient_name || '').trim();
                if (!age) age = String(pt.age || '').trim();
                if (!gender) gender = pt.gender || '';
                if (!phone_number) phone_number = (pt.phone_number || '').trim();
            }
        }

        // Optional fields
        const dob = data.dob || null;
        const parents = (data.parents || '').trim() || null;
        const relation = (data.relation || '').trim() || null;
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
        const patient_id = data.patient_id || null;

        const [parentResult] = await connection.query(`
            INSERT INTO tests (
                test_uid, visit_date, assigned_test_date, patient_name, phone_number,
                gender, age, dob, parents, relation, alternate_phone_no, address,
                limb, test_name, referred_by, test_done_by, created_by_employee_id,
                total_amount, advance_amount, discount, due_amount, payment_method,
                payment_status, branch_id, approval_status, patient_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            newTestUid, visit_date, assigned_test_date, patient_name, phone_number,
            gender, age, dob, parents, relation, alternate_phone_no, address,
            limb, parent_test_name, referred_by, test_done_by, employee_id,
            global_total_amount, advance_amount, discount, Math.max(0, global_due_amount), payment_method,
            global_payment_status, branch_id, approval_status, patient_id
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


exports.handleTestsRequest = async (req, res) => {
    const input = { ...req.query, ...req.body };
    const action = input.action || 'fetch';
    const branchId = req.user.branch_id || input.branch_id;

    if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

    try {
        switch (action) {
            case 'fetch':
                await fetchTests(req, res, branchId, input);
                break;
            case 'fetch_details':
                await fetchTestDetails(req, res, branchId, input.test_id);
                break;
            case 'update_metadata':
                await updateTestMetadata(req, res, branchId, input);
                break;
            case 'update_item':
                await updateTestItem(req, res, branchId, input);
                break;
            case 'add_payment':
                await addTestPayment(req, res, branchId, input);
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Tests Controller Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

async function fetchTests(req, res, branchId, input) {
    const search = input.search || "";
    const status = input.status || "";
    const payment_status = input.payment_status || "";
    const test_name = input.test_name || "";
    const page = parseInt(input.page) || 1;
    const limit = parseInt(input.limit) || 15;
    const offset = (page - 1) * limit;

    let whereClauses = ["branch_id = ?", "test_status != 'cancelled'"];
    let params = [branchId];

    if (search) {
        whereClauses.push("(patient_name LIKE ? OR phone_number LIKE ? OR test_uid LIKE ?)");
        const p = `%${search}%`;
        params.push(p, p, p);
    }
    if (status) {
        whereClauses.push("test_status = ?");
        params.push(status);
    }
    if (payment_status) {
        whereClauses.push("payment_status = ?");
        params.push(payment_status);
    }
    if (test_name) {
        whereClauses.push("test_name LIKE ?");
        params.push(`%${test_name}%`);
    }

    const [tests] = await pool.query(`
        SELECT 
            test_id as uid, patient_name, test_name, total_amount, 
            advance_amount as paid_amount, due_amount, payment_status, 
            test_status, created_at, test_uid
        FROM tests
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [[stats]] = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN test_status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN test_status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM tests
        WHERE branch_id = ? AND test_status != 'cancelled'
    `, [branchId]);

    res.json({
        success: true,
        data: tests,
        stats: {
            total: stats.total || 0,
            completed: stats.completed || 0,
            pending: stats.pending || 0
        }
    });
}

async function fetchTestDetails(req, res, branchId, testId) {
    if (!testId) throw new Error("Test ID required");

    const [mainRows] = await pool.query("SELECT * FROM tests WHERE test_id = ? AND branch_id = ?", [testId, branchId]);
    const mainTest = mainRows[0];
    if (!mainTest) throw new Error("Test not found");

    const [items] = await pool.query("SELECT * FROM test_items WHERE test_id = ? ORDER BY item_id ASC", [testId]);
    mainTest.test_items = items;

    res.json({ success: true, data: mainTest });
}

async function updateTestMetadata(req, res, branchId, input) {
    const { test_id } = input;
    if (!test_id) throw new Error("Test ID required");

    const allowedFields = [
        'patient_name', 'phone_number', 'gender', 'age', 'dob', 'parents',
        'relation', 'alternate_phone_no', 'address', 'referred_by', 'test_done_by',
        'assigned_test_date'
    ];

    let updates = [];
    let params = [];

    allowedFields.forEach(field => {
        if (input[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(input[field]);
        }
    });

    if (updates.length > 0) {
        params.push(test_id, branchId);
        await pool.query(`UPDATE tests SET ${updates.join(", ")} WHERE test_id = ? AND branch_id = ?`, params);
    }

    res.json({ success: true, message: "Metadata updated" });
}

async function updateTestItem(req, res, branchId, input) {
    const { item_id, test_status, payment_status } = input;
    if (!item_id) throw new Error("Item ID required");

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let updates = [];
        let params = [];

        if (test_status) { updates.push("test_status = ?"); params.push(test_status); }
        if (payment_status) { updates.push("payment_status = ?"); params.push(payment_status); }

        if (updates.length > 0) {
            params.push(item_id);
            await connection.query(`UPDATE test_items SET ${updates.join(", ")} WHERE item_id = ?`, params);
        }

        // Sync Parent Status
        const [itemRows] = await connection.query("SELECT test_id FROM test_items WHERE item_id = ?", [item_id]);
        const testId = itemRows[0].test_id;

        const [allItemRows] = await connection.query("SELECT test_status, payment_status FROM test_items WHERE test_id = ?", [testId]);

        let parentStatus = 'pending';
        if (allItemRows.every(i => i.test_status === 'completed')) parentStatus = 'completed';
        else if (allItemRows.some(i => i.test_status === 'completed' || i.test_status === 'in-progress')) parentStatus = 'pending';

        let parentPayStatus = 'pending';
        if (allItemRows.every(i => i.payment_status === 'paid')) parentPayStatus = 'paid';
        else if (allItemRows.some(i => i.payment_status === 'paid' || i.payment_status === 'partial')) parentPayStatus = 'partial';

        await connection.query("UPDATE tests SET test_status = ?, payment_status = ? WHERE test_id = ?", [parentStatus, parentPayStatus, testId]);

        await connection.commit();
        res.json({ success: true, message: "Item updated" });
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

async function addTestPayment(req, res, branchId, input) {
    const { test_id, item_id, amount, method, payments } = input;
    if (!test_id) throw new Error("Test ID required");

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const paymentList = payments && Array.isArray(payments)
            ? payments
            : (amount ? [{ method: method || 'cash', amount }] : []);

        if (paymentList.length === 0) throw new Error("No payment data provided");

        let totalBatchAmount = 0;

        for (const p of paymentList) {
            const pAmount = parseFloat(p.amount);
            if (pAmount > 0) {
                totalBatchAmount += pAmount;
                // 1. Record Payment
                await connection.query("INSERT INTO test_payments (test_id, payment_method, amount) VALUES (?, ?, ?)", [test_id, p.method || 'cash', pAmount]);
            }
        }

        if (totalBatchAmount <= 0) throw new Error("Total payment amount must be greater than zero");

        // 2. Update Parent Totals
        const [mainRows] = await connection.query("SELECT total_amount, advance_amount, discount FROM tests WHERE test_id = ?", [test_id]);
        const main = mainRows[0];
        const newAdvance = parseFloat(main.advance_amount) + totalBatchAmount;
        const newDue = Math.max(0, parseFloat(main.total_amount) - newAdvance - parseFloat(main.discount));

        let newPayStatus = 'pending';
        if (newDue <= 0) newPayStatus = 'paid';
        else if (newAdvance > 0) newPayStatus = 'partial';

        await connection.query("UPDATE tests SET advance_amount = ?, due_amount = ?, payment_status = ? WHERE test_id = ?", [newAdvance, newDue, newPayStatus, test_id]);

        // 3. Update Item
        if (item_id) {
            const [itemRows] = await connection.query("SELECT total_amount, advance_amount, discount FROM test_items WHERE item_id = ?", [item_id]);
            const item = itemRows[0];
            const iAdvance = parseFloat(item.advance_amount) + totalBatchAmount;
            const iDue = Math.max(0, parseFloat(item.total_amount) - iAdvance - parseFloat(item.discount));

            let iPayStatus = 'pending';
            if (iDue <= 0) iPayStatus = 'paid';
            else if (iAdvance > 0) iPayStatus = 'partial';

            await connection.query("UPDATE test_items SET advance_amount = ?, due_amount = ?, payment_status = ? WHERE item_id = ?", [iAdvance, iDue, iPayStatus, item_id]);
        }

        await connection.commit();
        res.json({ success: true, message: "Payment(s) recorded" });
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}
