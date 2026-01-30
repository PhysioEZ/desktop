const pool = require('../../config/db');

// Main Controller Function
exports.handleInquiryRequest = async (req, res) => {
    const input = req.body;
    const action = input.action || 'fetch';
    const branch_id = req.user.branch_id || input.branch_id;
    const employee_id = req.user.employee_id || input.employee_id;

    if (!branch_id) {
        return res.status(400).json({ status: 'error', message: 'Branch ID required' });
    }

    try {
        switch (action) {
            case 'fetch':
                await fetchInquiries(req, res, branch_id, input);
                break;
            case 'options':
                await fetchOptions(req, res, branch_id);
                break;
            case 'update_status':
                await updateStatus(req, res, branch_id, input);
                break;
            case 'delete':
                await deleteInquiry(req, res, branch_id, input);
                break;
            case 'fetch_followups':
                await fetchFollowups(req, res, branch_id, input);
                break;
            case 'add_followup':
                await addFollowup(req, res, branch_id, employee_id, input);
                break;
            default:
                res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Inquiry Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Sub-functions
async function fetchInquiries(req, res, branch_id, input) {
    const type = input.type || 'consultation';
    const search = input.search || '';
    const status = input.status || '';
    let query, params = [branch_id];

    if (type === 'consultation') {
        query = "SELECT *, expected_visit_date as next_followup_date FROM quick_inquiry WHERE branch_id = ?";
        if (search) {
            query += " AND (name LIKE ? OR phone_number LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
    } else {
        query = "SELECT *, expected_visit_date as next_followup_date FROM test_inquiry WHERE branch_id = ?";
        if (search) {
            query += " AND (name LIKE ? OR mobile_number LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
    }

    if (status) {
        query += " AND status = ?";
        params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT 100";

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: rows });
}

async function fetchOptions(req, res, branch_id) {
    const [complaints] = await pool.query("SELECT complaint_code as value, complaint_name as label FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branch_id]);
    const [sources] = await pool.query("SELECT source_code as value, source_name as label FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branch_id]);
    const [staff] = await pool.query("SELECT staff_id as value, staff_name as label FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name", [branch_id]);
    const [tests] = await pool.query("SELECT test_code as value, test_name as label FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branch_id]);
    const [limbs] = await pool.query("SELECT limb_code as value, limb_name as label FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branch_id]);

    res.json({
        status: 'success',
        data: { complaints, sources, staff, tests, limbs }
    });
}

async function updateStatus(req, res, branch_id, input) {
    const type = input.type || 'consultation';
    const id = input.id;
    const new_status = input.status;
    const table = (type === 'consultation') ? 'quick_inquiry' : 'test_inquiry';

    await pool.query(`UPDATE ${table} SET status = ? WHERE inquiry_id = ? AND branch_id = ?`, [new_status, id, branch_id]);
    res.json({ status: 'success', message: 'Status updated' });
}

async function deleteInquiry(req, res, branch_id, input) {
    const type = input.type || 'consultation';
    const id = input.id;
    const table = (type === 'consultation') ? 'quick_inquiry' : 'test_inquiry';

    await pool.query(`DELETE FROM ${table} WHERE inquiry_id = ? AND branch_id = ?`, [id, branch_id]);
    res.json({ status: 'success', message: 'Inquiry deleted' });
}

async function fetchFollowups(req, res, branch_id, input) {
    const type = input.type || 'consultation';
    const inquiry_id = input.inquiry_id;

    const [rows] = await pool.query(`
        SELECT f.*, CONCAT(e.first_name, ' ', e.last_name) as staff_name 
        FROM inquiry_followups f 
        LEFT JOIN employees e ON f.employee_id = e.employee_id 
        WHERE f.inquiry_id = ? AND f.inquiry_type = ? AND f.branch_id = ?
        ORDER BY f.created_at DESC
    `, [inquiry_id, type, branch_id]);

    res.json({ status: 'success', data: rows });
}

async function addFollowup(req, res, branch_id, employee_id, input) {
    const type = input.type || 'consultation';
    const inquiry_id = input.inquiry_id;
    const note = input.note;
    const next_date = input.next_date || null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            "INSERT INTO inquiry_followups (inquiry_id, inquiry_type, branch_id, employee_id, note, next_followup_date) VALUES (?, ?, ?, ?, ?, ?)",
            [inquiry_id, type, branch_id, employee_id, note, next_date]
        );

        if (next_date) {
            const table = (type === 'consultation') ? 'quick_inquiry' : 'test_inquiry';
            await connection.query(`UPDATE ${table} SET expected_visit_date = ? WHERE inquiry_id = ? AND branch_id = ?`, [next_date, inquiry_id, branch_id]);
        }

        await connection.commit();
        res.json({ status: 'success', message: 'Follow-up added' });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


// Regular Submissions (re-exporting from existing implementations if needed, but handled by handleInquiryRequest for options/fetch, 
// submission logic is in submitInquiry and submitTestInquiry in original file.
// We should MERGE the logic.
// The previous step created inquiry.js with ONLY submit logic.
// This step overwrites it with everything needed for the Inquiry PAGE (fetch, options, etc).
// We need to keep the submit logic too.

exports.submitInquiry = async (req, res) => {
    // ... (Logic from previous step)
    // Actually, to keep it clean, let's paste the submit logic here too.
    const data = req.body;
    const branch_id = req.user.branch_id || data.branch_id;
    const employee_id = req.user.employee_id || data.employee_id;

    if (!branch_id || !employee_id) return res.status(400).json({ success: false, message: 'Branch ID and Employee ID required' });

    try {
        const patient_name = (data.patient_name || '').trim();
        const age = (data.age || '').trim();
        const gender = data.gender || '';
        const phone = (data.phone || '').trim();

        if (!patient_name || !age || !gender || !phone) return res.status(400).json({ success: false, message: "Required fields are missing: Name, Age, Gender, Phone." });

        const conditionType = data.conditionType;
        let chief_complain = '';
        if (conditionType === 'other' && data.conditionType_other) chief_complain = data.conditionType_other;
        else chief_complain = conditionType || 'other';

        const inquiry_type = data.inquiry_type || null;
        const communication_type = data.communication_type || null;
        const referralSource = data.referralSource || 'self';
        const remarks = data.remarks || null;
        const expected_date = data.expected_date || null;

        const [result] = await pool.query(`
            INSERT INTO quick_inquiry 
            (name, age, gender, inquiry_type, communication_type, referralSource, chief_complain, phone_number, review, expected_visit_date, branch_id, created_by_employee_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            patient_name, age, gender, inquiry_type, communication_type, referralSource,
            chief_complain, phone, remarks, expected_date, branch_id, employee_id
        ]);

        res.json({ success: true, message: "Inquiry saved successfully.", inquiry_id: result.insertId });
    } catch (error) {
        console.error("Submit Inquiry Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitTestInquiry = async (req, res) => {
    // ... (Logic from previous step)
    const data = req.body;
    const branch_id = req.user.branch_id || data.branch_id;
    const employee_id = req.user.employee_id || data.employee_id;

    if (!branch_id || !employee_id) return res.status(400).json({ success: false, message: 'Branch ID and Employee ID required' });

    try {
        const patient_name = (data.patient_name || '').trim();
        const test_name = (data.test_name || '').trim();
        const phone_number = (data.phone_number || '').trim();

        if (!patient_name || !test_name || !phone_number) return res.status(400).json({ success: false, message: "Required fields are missing: Patient Name, Test Name, Phone." });

        const referred_by = data.referred_by || null;
        const expected_visit_date = data.expected_visit_date || null;

        const [result] = await pool.query(`
            INSERT INTO test_inquiry 
            (name, testname, reffered_by, mobile_number, expected_visit_date, branch_id, created_by_employee_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            patient_name, test_name, referred_by, phone_number, expected_visit_date, branch_id, employee_id
        ]);

        res.json({ success: true, message: "Test inquiry saved successfully.", test_inquiry_id: result.insertId });
    } catch (error) {
        console.error("Submit Test Inquiry Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
