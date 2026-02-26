const pool = require('../../config/db');

exports.approveRequest = async (req, res) => {
    const { request_id, request_type, status, approved_by, branch_id } = req.body;

    if (!request_id || !request_type || !status) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (request_type === 'registration') {
            await connection.query(`
                UPDATE registration 
                SET approval_status = ?, 
                    status = CASE WHEN ? = 'approved' AND status = 'Pending' THEN 'Pending' ELSE status END
                WHERE registration_id = ?
            `, [status, status, request_id]);
        } else if (request_type === 'test') {
            await connection.query(`
                UPDATE tests 
                SET approval_status = ? 
                WHERE test_id = ?
            `, [status, request_id]);
        } else {
            throw new Error('Invalid request type');
        }

        await connection.commit();
        res.json({ success: true, message: `Request ${status} successfully` });

    } catch (error) {
        await connection.rollback();
        console.error("Approve Request Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
