const pool = require('../../config/db');

exports.getProfileData = async (req, res) => {
    try {
        const employeeId = req.user.employee_id;

        const query = `
            SELECT 
                e.employee_id, e.first_name, e.last_name, e.job_title, e.phone_number, 
                e.address, e.date_of_birth, e.date_of_joining, e.is_active, e.photo_path,
                e.email,
                e.created_at,
                r.role_name AS role,
                b.branch_id, b.branch_name, b.logo_primary_path, b.clinic_name, 
                b.address_line_1, b.address_line_2, b.city, b.state, b.pincode, 
                b.phone_primary, b.email AS branch_email
            FROM 
                employees e
            LEFT JOIN 
                roles r ON e.role_id = r.role_id
            LEFT JOIN 
                branches b ON e.branch_id = b.branch_id
            WHERE 
                e.employee_id = ? LIMIT 1
        `;

        const [rows] = await pool.query(query, [employeeId]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
