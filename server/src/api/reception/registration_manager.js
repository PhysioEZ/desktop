const pool = require('../../config/db');

// Main Handler
exports.handleRegistrationRequest = async (req, res) => {
    const input = req.body;
    // Allow action to come from body or query (for GET compatibility if mixed, though here we generally use POST)
    const action = input.action || req.query.action || 'fetch';
    const branch_id = req.user.branch_id || input.branch_id || req.query.branch_id;

    if (!branch_id) return res.status(400).json({ status: 'error', message: 'Branch ID required' });

    try {
        switch (action) {
            case 'fetch':
                await fetchRegistrations(req, res, branch_id, input);
                break;
            case 'options':
                await fetchFilterOptions(req, res, branch_id);
                break;
            case 'details':
                const id = input.id || req.query.id;
                await fetchRegistrationDetails(req, res, id);
                break;
            case 'update_status':
                await updateRegistrationStatus(req, res, input);
                break;
            case 'update_details':
                await updateRegistrationDetails(req, res, input);
                break;
            case 'refund':
                await initiateRegistrationRefund(req, res, branch_id, input);
                break;
            default:
                res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Registration Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Sub-functions
async function fetchRegistrations(req, res, branch_id, input) {
    const search = input.search || '';
    const status = input.status || '';
    const referred_by = input.referred_by || '';
    const condition = input.condition || '';
    const type = input.type || '';

    const page = parseInt(input.page) || 1;
    const limit = parseInt(input.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT reg.*, pm.patient_uid, pm.full_name as master_full_name 
        FROM registration reg 
        LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
        WHERE reg.branch_id = ?
    `;
    const params = [branch_id];
    let countParams = [branch_id];
    let whereClause = "";

    if (search) {
        whereClause += " AND (reg.patient_name LIKE ? OR reg.phone_number LIKE ? OR pm.patient_uid LIKE ?)";
        const p = `%${search}%`;
        params.push(p, p, p);
        countParams.push(p, p, p);
    }

    if (status) {
        whereClause += " AND reg.status = ?";
        params.push(status);
        countParams.push(status);
    } else {
        whereClause += " AND reg.status != 'closed'";
    }

    if (referred_by) {
        whereClause += " AND reg.reffered_by = ?";
        params.push(referred_by);
        countParams.push(referred_by);
    }

    if (condition) {
        whereClause += " AND reg.chief_complain = ?";
        params.push(condition);
        countParams.push(condition);
    }

    if (type) {
        whereClause += " AND reg.consultation_type = ?";
        params.push(type);
        countParams.push(type);
    }

    // Count Total
    const [countRows] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM registration reg 
        LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id 
        WHERE reg.branch_id = ? ${whereClause}
    `, countParams);
    const total = countRows[0].total;

    // Fetch Data
    query += whereClause + " ORDER BY reg.registration_id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    res.json({
        status: 'success',
        data: rows,
        pagination: {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        }
    });
}

async function fetchFilterOptions(req, res, branch_id) {
    const [referred] = await pool.query("SELECT DISTINCT reffered_by FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != '' ORDER BY reffered_by", [branch_id]);
    const [conditions] = await pool.query("SELECT DISTINCT chief_complain FROM registration WHERE branch_id = ? AND chief_complain IS NOT NULL AND chief_complain != '' ORDER BY chief_complain", [branch_id]);
    const [types] = await pool.query("SELECT DISTINCT consultation_type FROM registration WHERE branch_id = ? AND consultation_type IS NOT NULL AND consultation_type != '' ORDER BY consultation_type", [branch_id]);
    const [methods] = await pool.query("SELECT method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branch_id]);
    const [serviceTracks] = await pool.query("SELECT * FROM service_tracks WHERE is_active = 1 ORDER BY name ASC");

    res.json({
        status: 'success',
        data: {
            referred_by: referred.map(r => r.reffered_by),
            conditions: conditions.map(c => c.chief_complain),
            types: types.map(t => t.consultation_type),
            payment_methods: methods.map(m => m.method_name),
            service_tracks: serviceTracks
        }
    });
}

async function fetchRegistrationDetails(req, res, id) {
    if (!id) return res.status(400).json({ status: 'error', message: 'Registration ID required' });

    const [rows] = await pool.query(`
        SELECT reg.*, pm.patient_uid, 
               b.branch_name, b.clinic_name, b.address_line_1, b.address_line_2, 
               b.city, b.phone_primary, b.logo_primary_path
        FROM registration reg 
        LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
        LEFT JOIN branches b ON reg.branch_id = b.branch_id
        WHERE reg.registration_id = ?
    `, [id]);

    const data = rows[0];
    if (data) {
        const [existing] = await pool.query("SELECT service_type, patient_id FROM patients WHERE registration_id = ?", [id]);
        data.existing_services = existing;
        data.patient_exists_count = existing.length;
    }

    res.json({ status: 'success', data });
}

async function updateRegistrationStatus(req, res, input) {
    const { id, status } = input;
    if (!id || !status) return res.status(400).json({ status: 'error', message: 'ID and status required' });

    await pool.query("UPDATE registration SET status = ? WHERE registration_id = ?", [status, id]);
    res.json({ status: 'success' });
}

async function updateRegistrationDetails(req, res, input) {
    const { registration_id } = input;
    if (!registration_id) return res.status(400).json({ status: 'error', message: 'Registration ID required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [regRows] = await connection.query("SELECT branch_id, consultation_amount, approval_status FROM registration WHERE registration_id = ?", [registration_id]);
        const currentReg = regRows[0];
        if (!currentReg) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Registration not found' });
        }

        const fields = [
            'patient_name', 'age', 'gender', 'phone_number', 'email', 'address',
            'chief_complain', 'consultation_type', 'reffered_by',
            'consultation_amount', 'payment_method', 'doctor_notes',
            'prescription', 'follow_up_date', 'remarks', 'status'
        ];

        let updates = [];
        let params = [];

        fields.forEach(field => {
            if (input[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(input[field]);
            }
        });

        // Auto-Approval Logic
        if (input.consultation_amount !== undefined) {
            const newAmount = parseFloat(input.consultation_amount);

            const [settings] = await connection.query("SELECT setting_value FROM clinic_settings WHERE branch_id = ? AND setting_key = 'consultation_fee'", [currentReg.branch_id]);
            const standardFee = (settings.length > 0 && settings[0].setting_value) ? parseFloat(settings[0].setting_value) : 500.00;

            if (newAmount >= standardFee) {
                if (currentReg.approval_status !== 'approved') {
                    updates.push("approval_status = 'approved'");
                    updates.push("approved_at = NOW()");
                    if (!input.status) {
                        updates.push("status = 'pending'");
                    }
                }
            } else {
                if (currentReg.approval_status === 'rejected') {
                    updates.push("approval_status = 'pending'");
                }
            }
        }

        if (updates.length > 0) {
            params.push(registration_id);
            await connection.query(`UPDATE registration SET ${updates.join(', ')} WHERE registration_id = ?`, params);
        }

        await connection.commit();
        res.json({ status: 'success' });

    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

async function initiateRegistrationRefund(req, res, branch_id, input) {
    const { registration_id, refund_amount, refund_reason } = input;
    if (!registration_id || !refund_amount || !branch_id) {
        return res.status(400).json({ status: 'error', message: "Missing required fields" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [regRows] = await connection.query("SELECT consultation_amount FROM registration WHERE registration_id = ? AND branch_id = ?", [registration_id, branch_id]);
        const reg = regRows[0];

        if (!reg || parseFloat(refund_amount) > parseFloat(reg.consultation_amount)) {
            await connection.rollback();
            return res.json({ status: 'error', message: "Refund amount cannot exceed the amount paid" });
        }

        await connection.query("UPDATE registration SET refund_status = 'initiated' WHERE registration_id = ?", [registration_id]);

        await connection.commit();
        res.json({ status: 'success', message: "Refund initiated successfully" });
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

// ... existing submitRegistration export if any (merged into registration.js previously? No, registration.js was submit only)
// Now we need to MERGE the submit logic from the OLD registration.js (step 16 in previous convo?? or earlier?)
// Wait, I saw registration.js content in step 570 - wait, no I viewed it via view_file in step 567?
// I need to make sure I don't lose submitRegistration.
// Let's check the current content of registration.js again before overwriting!
// Actually, I can just append `exports.submitRegistration = ...` if I have the code.
// I viewed it in step 569 (lines_viewed 1-180 of server/src/api/reception/registration.js).
// It has `exports.submitRegistration = async (req, res) => { ... }`.
// I should keep that.

const originalSubmit = require('./registration_submit_logic'); // Wait, I don't have this file.
// I should read the current `registration.js` file, take its content, and append the new handlers.
