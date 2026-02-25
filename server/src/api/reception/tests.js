const pool = require('../../config/db');
const SyncService = require('../../services/SyncService');


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

        // 2. Check for existing session (Test Grouping)
        let parent_test_id = null;
        let existing_test = null;
        let newTestUid = null;

        if (patient_id) {
            const [existingRows] = await connection.query(
                "SELECT * FROM tests WHERE patient_id = ? AND test_status != 'cancelled' ORDER BY created_at DESC LIMIT 1",
                [patient_id]
            );
            if (existingRows.length > 0) {
                existing_test = existingRows[0];
                parent_test_id = existing_test.test_id;
                newTestUid = existing_test.test_uid;
            }
        }

        // 3. Generate Test UID (only if new)
        if (!parent_test_id) {
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
                const suffix = lastUid.substring(6);
                serial = parseInt(suffix, 10) || 0;
            }
            serial++;
            newTestUid = datePrefix + String(serial).padStart(2, '0');
        }

        // 4. Calculate Global Totals and Update/Insert Parent
        let batch_total_amount = 0.00;
        test_names.forEach(name => {
            const amt = parseFloat(test_amounts[name] || 0);
            batch_total_amount += amt;
        });

        const parent_test_name_part = test_names.map(t => t.toUpperCase()).join(', ');

        if (parent_test_id) {
            // Update Existing Parent
            const updated_total = parseFloat(existing_test.total_amount) + batch_total_amount;
            const updated_discount = parseFloat(existing_test.discount) + discount;
            const combinedNames = (existing_test.test_name || '') + ', ' + parent_test_name_part;
            const uniqueNames = [...new Set(combinedNames.toUpperCase().split(',').map(s => s.trim()))].filter(Boolean).join(', ');
            const updated_test_name = uniqueNames;

            await connection.query(`
                UPDATE tests SET 
                    total_amount = ?, discount = ?, test_name = ?,
                    referred_by = COALESCE(?, referred_by),
                    test_done_by = COALESCE(?, test_done_by)
                WHERE test_id = ?
            `, [updated_total, updated_discount, updated_test_name, referred_by, test_done_by, parent_test_id]);
        } else {
            // Insert New Parent
            const approval_status = (advance_amount === 0) ? 'pending' : 'approved';
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
                limb, parent_test_name_part, referred_by, test_done_by, employee_id,
                batch_total_amount, 0, discount, 0, payment_method,
                'pending', branch_id, approval_status, patient_id
            ]);
            parent_test_id = parentResult.insertId;
        }

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
        for (const single_test_name of test_names) {
            const current_total_amount = parseFloat(test_amounts[single_test_name] || 0);

            // In our new transaction-based system, we don't necessarily need to distribute advance/discount immediately to rows
            // But for compatibility with existing views, we'll set them to 0 or prorate if it's a new record.
            // For now, let's keep it simple: parent has the totals, items have their specific amounts.

            const [itemResult] = await connection.query(`
                INSERT INTO test_items (
                    test_id, created_by_employee_id, assigned_test_date, test_name,
                    limb, referred_by, test_done_by, total_amount, advance_amount, discount,
                    due_amount, payment_method, test_status, payment_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'pending', 'pending', NOW())
            `, [
                parent_test_id, employee_id, assigned_test_date, single_test_name,
                limb, referred_by, test_done_by, current_total_amount,
                current_total_amount, payment_method
            ]);

            const newItemId = itemResult.insertId;

            // 7. Referral Logic (Inside loop)
            if (referred_by) {
                const [pRules] = await connection.query("SELECT partner_id FROM referral_partners WHERE TRIM(name) = ? LIMIT 1", [referred_by]);
                if (pRules.length > 0) {
                    const pId = pRules[0].partner_id;
                    // Update parent referral_partner_id only if it's the first item or not set yet
                    // This ensures the parent test record reflects the referral partner for the whole batch
                    await connection.query("UPDATE tests SET referral_partner_id = ? WHERE test_id = ? AND referral_partner_id IS NULL", [pId, parent_test_id]);
                    await connection.query("UPDATE test_items SET referral_partner_id = ? WHERE item_id = ?", [pId, newItemId]);

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

        // 8. Recalculate Aggregated Totals and Status for the Session
        const [aggRows] = await connection.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_paid
            FROM test_payments 
            WHERE test_id = ?
        `, [parent_test_id]);

        const total_paid = parseFloat(aggRows[0].total_paid);
        const [currentParent] = await connection.query("SELECT total_amount, discount FROM tests WHERE test_id = ?", [parent_test_id]);
        const final_total = parseFloat(currentParent[0].total_amount);
        const final_discount = parseFloat(currentParent[0].discount);
        const final_due = Math.max(0, final_total - total_paid - final_discount);

        let final_payment_status = 'pending';
        if (final_total === 0) final_payment_status = 'paid';
        else if (final_due <= 0) final_payment_status = 'paid';
        else if (total_paid > 0) final_payment_status = 'partial';

        await connection.query(`
            UPDATE tests SET 
                advance_amount = ?, 
                due_amount = ?, 
                payment_status = ? 
            WHERE test_id = ?
        `, [total_paid, final_due, final_payment_status, parent_test_id]);

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

        // 2. Check for existing session (Grouping)
        let testId = null;
        let newTestUid = null;
        let existing_test = null;
        const today = new Date().toISOString().split('T')[0]; // Define today here

        const [existingRows] = await connection.query(
            "SELECT * FROM tests WHERE patient_id = ? AND test_status != 'cancelled' ORDER BY created_at DESC LIMIT 1",
            [patientId]
        );

        if (existingRows.length > 0) {
            existing_test = existingRows[0];
            testId = existing_test.test_id;
            newTestUid = existing_test.test_uid;

            // Update Existing Parent
            const updated_total = parseFloat(existing_test.total_amount) + total;
            const combinedNames = (existing_test.test_name || '') + ', ' + 'General Test';
            const uniqueNames = [...new Set(combinedNames.toUpperCase().split(',').map(s => s.trim()))].filter(Boolean).join(', ');
            const updated_test_name = uniqueNames;

            await connection.query(`
                UPDATE tests SET 
                    total_amount = ?, test_name = ?
                WHERE test_id = ?
            `, [updated_total, updated_test_name, testId]);
        } else {
            // Generate New UID
            const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
            const [lastUidRows] = await connection.query("SELECT test_uid FROM tests WHERE test_uid LIKE ? ORDER BY test_uid DESC LIMIT 1", [datePrefix + '%']);
            const lastUid = lastUidRows.length > 0 ? lastUidRows[0].test_uid : null;
            let serial = lastUid ? parseInt(lastUid.substring(6)) : 0;
            serial++;
            newTestUid = datePrefix + String(serial).padStart(2, '0');

            // Insert New Parent
            const [testResult] = await connection.query(`
                INSERT INTO tests (
                    test_uid, visit_date, assigned_test_date, patient_name, phone_number,
                    gender, age, test_name, total_amount, advance_amount, due_amount, 
                    payment_status, branch_id, approval_status, patient_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'General Test (Patient Module)', ?, 0, ?, 'pending', ?, ?, ?)
            `, [
                newTestUid, today, today, patient.patient_name || 'N/A', patient.patient_phone || 'N/A',
                patient.patient_gender || 'N/A', patient.patient_age || 'N/A',
                total, total, patient.branch_id, (advance === 0 ? 'pending' : 'approved'), patientId
            ]);
            testId = testResult.insertId;
        }

        // 3. Insert into test_items
        await connection.query(`
            INSERT INTO test_items(
                    test_id, test_name, total_amount, advance_amount, due_amount, payment_status, created_at
                ) VALUES(?, 'General Test', ?, 0, ?, 'pending', NOW())
                    `, [testId, total, total]);

        // 4. Insert into test_payments (Transaction Table)
        if (advance > 0) {
            await connection.query(`
                INSERT INTO test_payments(test_id, payment_method, amount)
            VALUES(?, 'Cash', ?)
                `, [testId, advance]);

            // Also record in global payments table for overall tracking if needed
            await connection.query(`
                INSERT INTO payments(patient_id, amount, payment_method, mode, payment_date, remarks, branch_id, created_at, processed_by_employee_id)
            VALUES(?, ?, 'Cash', 'Cash', ?, 'Test Advance', ?, NOW(), ?)
                `, [patientId, advance, today, patient.branch_id, req.user?.employee_id || 0]);
        }

        // 5. Recalculate Aggregated Totals
        const [aggRows] = await connection.query(`
            SELECT COALESCE(SUM(amount), 0) as total_paid FROM test_payments WHERE test_id = ?
                `, [testId]);

        const total_paid = parseFloat(aggRows[0].total_paid);
        const [finalParent] = await connection.query("SELECT total_amount, discount FROM tests WHERE test_id = ?", [testId]);
        const final_total = parseFloat(finalParent[0].total_amount);
        const final_discount = parseFloat(finalParent[0].discount);
        const final_due = Math.max(0, final_total - total_paid - final_discount);

        let final_status = 'pending';
        if (final_due <= 0) final_status = 'paid';
        else if (total_paid > 0) final_status = 'partial';

        await connection.query(`
            UPDATE tests SET advance_amount = ?, due_amount = ?, payment_status = ?
                WHERE test_id = ?
                    `, [total_paid, final_due, final_status, testId]);

        await connection.commit();
        res.json({ success: true, message: 'Test added successfully' });
        SyncService.syncTable('tests', req.user.token, req.user.branch_id).catch(() => { });


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
            case 'get_bill':
                await fetchTestBill(req, res, branchId, input.test_id);
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

    const [
        [tests],
        [[stats]]
    ] = await Promise.all([
        pool.query(`
            SELECT
            test_id as uid, patient_name, test_name, total_amount,
                advance_amount as paid_amount, due_amount, payment_status,
                test_status, created_at, test_uid
        FROM tests
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY created_at DESC
            LIMIT ? OFFSET ?
                `, [...params, limit, offset]),
        pool.query(`
        SELECT
            COUNT(*) as total,
                SUM(CASE WHEN test_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN test_status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM tests
        WHERE branch_id = ? AND test_status != 'cancelled'
                `, [branchId])
    ]);

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

    const [payments] = await pool.query("SELECT * FROM test_payments WHERE test_id = ? ORDER BY created_at DESC", [testId]);
    mainTest.test_payments = payments;

    res.json({ success: true, data: mainTest });
}

async function fetchTestBill(req, res, branchId, testId) {
    if (!testId) throw new Error("Test ID required");

    const [mainRows] = await pool.query("SELECT * FROM tests WHERE test_id = ? AND branch_id = ?", [testId, branchId]);
    const mainTest = mainRows[0];
    if (!mainTest) throw new Error("Test not found");

    const [items] = await pool.query("SELECT * FROM test_items WHERE test_id = ? ORDER BY item_id ASC", [testId]);

    // Fetch Branch Details
    const [branchRows] = await pool.query(
        "SELECT clinic_name, address_line_1, phone_primary FROM branches WHERE branch_id = ?",
        [mainTest.branch_id]
    );
    const branch = branchRows[0] || {};

    const token_date = new Date(mainTest.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date(mainTest.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const [payments] = await pool.query("SELECT amount, payment_method, created_at FROM test_payments WHERE test_id = ? ORDER BY created_at ASC", [testId]);

    const billData = {
        uid: mainTest.test_uid,
        patient_name: mainTest.patient_name,
        test_name: mainTest.test_name,
        total_amount: mainTest.total_amount,
        paid_amount: mainTest.advance_amount,
        due_amount: mainTest.due_amount,
        discount: mainTest.discount,
        payment_status: mainTest.payment_status,
        test_status: mainTest.test_status,
        date: token_date,
        clinic_name: branch.clinic_name,
        branch_address: branch.address_line_1,
        branch_phone: branch.phone_primary,
        items: items.map(i => ({
            name: i.test_name,
            amount: i.total_amount
        })),
        payments_history: payments.map(p => ({
            amount: p.amount,
            method: p.payment_method,
            date: new Date(p.created_at).toLocaleDateString("en-GB")
        }))
    };

    res.json({ success: true, data: billData });
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
        await pool.query(`UPDATE tests SET ${updates.join(", ")} WHERE test_id = ? AND branch_id = ? `, params);
    }

    res.json({ success: true, message: "Metadata updated" });
    SyncService.syncTable('tests', req.user.token, req.user.branch_id).catch(() => { });

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
            await connection.query(`UPDATE test_items SET ${updates.join(", ")} WHERE item_id = ? `, params);
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
        SyncService.syncTable('tests', req.user.token, req.user.branch_id).catch(() => { });

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

        // 2. Recalculate Aggregated Totals and Status
        const [aggRows] = await connection.query(`
            SELECT
            COALESCE(SUM(amount), 0) as total_paid
            FROM test_payments 
            WHERE test_id = ?
                `, [test_id]);

        const total_paid = parseFloat(aggRows[0].total_paid);
        const [currentParent] = await connection.query("SELECT total_amount, discount FROM tests WHERE test_id = ?", [test_id]);
        const final_total = parseFloat(currentParent[0].total_amount);
        const final_discount = parseFloat(currentParent[0].discount);
        const final_due = Math.max(0, final_total - total_paid - final_discount);

        let final_payment_status = 'pending';
        if (final_total === 0) final_payment_status = 'paid';
        else if (final_due <= 0) final_payment_status = 'paid';
        else if (total_paid > 0) final_payment_status = 'partial';

        await connection.query(`
            UPDATE tests SET
            advance_amount = ?,
                due_amount = ?,
                payment_status = ?
                    WHERE test_id = ?
                        `, [total_paid, final_due, final_payment_status, test_id]);

        // 3. Update Item (Optional: Prorate or just update status)
        if (item_id) {
            // For now, we'll just update the status if the parent is paid
            let itemPayStatus = final_payment_status;
            await connection.query("UPDATE test_items SET payment_status = ? WHERE item_id = ?", [itemPayStatus, item_id]);
        }

        await connection.commit();
        res.json({ success: true, message: "Payment(s) recorded" });
        SyncService.syncTable('tests', req.user.token, req.user.branch_id).catch(() => { });

    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}
