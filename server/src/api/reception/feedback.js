const pool = require("../../config/db");

exports.handleFeedbackRequest = async (req, res) => {
    const input = { ...req.query, ...req.body };
    const action = input.action || 'fetch';
    const branchId = req.user.branch_id || input.branch_id;

    if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

    try {
        switch (action) {
            case 'fetch':
                await fetchFeedbacks(req, res, branchId, input);
                break;
            case 'search_patients':
                await searchPatientsForFeedback(req, res, branchId, input);
                break;
            case 'submit':
                await submitFeedback(req, res, branchId, input);
                break;
            case 'resolve':
                await resolveFeedback(req, res, branchId, input);
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Feedback Controller Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

async function fetchFeedbacks(req, res, branchId, input) {
    const limit = parseInt(input.limit) || 10;
    const page = parseInt(input.page) || 1;
    const offset = (page - 1) * limit;

    // Fetch Recent Feedback
    const [feedbacks] = await pool.query(`
        SELECT pf.*, r.patient_name, r.phone_number, e.first_name, e.last_name, e_res.first_name as res_first, e_res.last_name as res_last
        FROM patient_feedback pf
        JOIN patients p ON pf.patient_id = p.patient_id
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN employees e ON pf.created_by_employee_id = e.employee_id
        LEFT JOIN employees e_res ON pf.resolved_by = e_res.employee_id
        WHERE pf.branch_id = ?
        ORDER BY pf.created_at DESC
        LIMIT ? OFFSET ?
    `, [branchId, limit, offset]);

    const [[totalRecords]] = await pool.query(`SELECT COUNT(*) as c FROM patient_feedback WHERE branch_id = ?`, [branchId]);

    // Stats
    const [[stats]] = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN feedback_type = 'Good' THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN feedback_type = 'Average' THEN 1 ELSE 0 END) as average,
            SUM(CASE WHEN feedback_type = 'Bad' THEN 1 ELSE 0 END) as bad
        FROM patient_feedback
        WHERE branch_id = ?
    `, [branchId]);

    // Format for frontend
    const uiRecords = feedbacks.map(fb => ({
        id: fb.feedback_id || fb.id || Math.random(),
        date: fb.created_at,
        patient_name: fb.patient_name,
        phone_number: fb.phone_number,
        added_by: fb.first_name ? (fb.first_name + (fb.last_name ? ' ' + fb.last_name : '')) : 'Unknown',
        rating: fb.feedback_type,
        status: fb.patient_status_snapshot === 'active' ? 'Ongoing' : (fb.patient_status_snapshot === 'completed' ? 'Completed' : 'Discontinued'),
        comment: fb.comments || '',
        is_resolved: fb.is_resolved ? true : false,
        resolution_note: fb.resolution_note || '',
        resolved_by_name: fb.res_first ? (fb.res_first + (fb.res_last ? ' ' + fb.res_last : '')) : null,
        resolved_at: fb.resolved_at
    }));

    res.json({
        success: true,
        data: uiRecords,
        pagination: {
            total: totalRecords.c,
            page,
            limit,
            totalPages: Math.ceil(totalRecords.c / limit)
        },
        stats: {
            total: stats.total || 0,
            good: stats.good || 0,
            average: stats.average || 0,
            bad: stats.bad || 0
        }
    });
}

async function searchPatientsForFeedback(req, res, branchId, input) {
    const search = input.search || '';
    let query = `
        SELECT p.patient_id, r.patient_name, r.phone_number, p.status
        FROM patients p 
        JOIN registration r ON p.registration_id = r.registration_id
        WHERE p.branch_id = ? 
    `;
    let queryParams = [branchId];

    if (search) {
        query += ` AND (r.patient_name LIKE ? OR r.phone_number LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY r.patient_name ASC LIMIT 50`;

    const [patients] = await pool.query(query, queryParams);
    res.json({ success: true, data: patients });
}

async function submitFeedback(req, res, branchId, input) {
    const employeeId = req.user.employee_id;
    const { patient_id, feedback_type, patient_status, comments } = input;

    if (!patient_id) throw new Error("Patient ID is required");

    const statusMap = {
        'active': 'active',
        'completed': 'completed',
        'discontinued': 'inactive'
    };

    const dbStatus = statusMap[patient_status] || 'active';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(`
            INSERT INTO patient_feedback 
            (patient_id, branch_id, feedback_type, patient_status_snapshot, comments, created_by_employee_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            patient_id,
            branchId,
            feedback_type || 'Good',
            patient_status || 'active',
            comments || '',
            employeeId
        ]);

        await connection.query(`
            UPDATE patients SET status = ? WHERE patient_id = ? AND branch_id = ?
        `, [dbStatus, patient_id, branchId]);

        await connection.commit();
        res.json({ success: true, message: 'Feedback recorded successfully!' });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function resolveFeedback(req, res, branchId, input) {
    const employeeId = req.user.employee_id;
    const { feedback_id, resolution_note } = input;

    if (!feedback_id) throw new Error("Feedback ID is required");

    const [[colCheck]] = await pool.query(`SHOW COLUMNS FROM patient_feedback LIKE "feedback_id"`);
    const idField = colCheck ? 'feedback_id' : 'id';

    await pool.query(`
        UPDATE patient_feedback 
        SET is_resolved = 1, resolution_note = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE ${idField} = ? AND branch_id = ?
    `, [resolution_note || '', employeeId, feedback_id, branchId]);

    res.json({ success: true, message: 'Feedback resolved successfully!' });
}
