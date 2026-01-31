const pool = require('../../config/db');

exports.handleAddPayment = async (req, res) => {
    try {
        const input = req.body;
        const patientId = input.patient_id;
        const amount = parseFloat(input.amount || input.dues_amount || 0);
        const method = input.method || input.payment_method || input.payment_mode || 'cash';
        const remarks = input.remarks || '';

        if (!patientId || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid patient ID and amount required' });
        }

        await pool.query(`
            INSERT INTO payments (patient_id, branch_id, amount, mode, payment_date, remarks, created_at, processed_by_employee_id)
            VALUES (?, ?, ?, ?, CURDATE(), ?, NOW(), ?)
        `, [patientId, req.user.branch_id, amount, method, remarks, req.user.employee_id]);

        res.json({ success: true, message: 'Payment added successfully' });

    } catch (error) {
        console.error("Add Payment Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
