const pool = require('../../config/db');

// Main Handler for Patients Search
exports.handleSearchPatients = async (req, res) => {
    try {
        const branch_id = req.user.branch_id || req.query.branch_id;
        const searchTerm = req.query.q || '';

        if (!branch_id) {
            return res.status(400).json({ success: false, message: 'Branch ID required', patients: [] });
        }

        if (!searchTerm) {
            const [rows] = await pool.query(`
                SELECT
                    p.patient_id,
                    r.patient_name,
                    pm.patient_uid,
                    r.age,
                    r.gender,
                    r.phone_number,
                    p.status
                FROM patients p
                JOIN registration r ON p.registration_id = r.registration_id
                LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
                WHERE p.branch_id = ?
                ORDER BY p.patient_id DESC
                LIMIT 20
            `, [branch_id]);
            return res.json({ success: true, patients: rows });
        }

        if (searchTerm.length < 2) {
            return res.json({ success: true, patients: [] });
        }

        const query = `
            SELECT
                p.patient_id,
                r.patient_name,
                pm.patient_uid,
                r.age,
                r.gender,
                r.phone_number,
                p.status
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            WHERE
                p.branch_id = ? AND (
                    r.patient_name LIKE ? OR
                    pm.patient_uid LIKE ? OR
                    r.phone_number LIKE ?
                )
            ORDER BY 
                CASE 
                    WHEN r.patient_name LIKE ? THEN 1
                    WHEN r.patient_name LIKE ? THEN 2
                    ELSE 3
                END,
                p.patient_id DESC
            LIMIT 15
        `;

        const p = `%${searchTerm}%`;
        const params = [
            branch_id,
            p, p, p,
            searchTerm,     // exact match
            `${searchTerm}%` // starts with
        ];

        const [rows] = await pool.query(query, params);
        res.json({ success: true, patients: rows });

    } catch (error) {
        console.error("Search Patients Error:", error);
        res.status(500).json({ success: false, message: error.message, patients: [] });
    }
};

// Also export as searchPatients for consistency with router expectations
exports.searchPatients = exports.handleSearchPatients;

exports.handleGetPaymentMethods = async (req, res) => {
    try {
        const branch_id = req.user.branch_id;

        const [rows] = await pool.query(`
            SELECT method_code, method_name 
            FROM payment_methods 
            WHERE branch_id = ? AND is_active = 1 
            ORDER BY display_order ASC
        `, [branch_id]);

        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error("Get Payment Methods Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.handleGetSlots = async (req, res) => {
    try {
        const branch_id = req.user.branch_id;
        if (!branch_id) {
            throw new Error('Invalid branch_id associated with token.');
        }

        const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

        // Fetch filled slots
        const [rows] = await pool.query(`
            SELECT appointment_time 
            FROM registration 
            WHERE appointment_date = ?
              AND branch_id = ?
              AND appointment_time IS NOT NULL
              AND status NOT IN ('closed', 'cancelled')
        `, [selectedDate, branch_id]);

        const filledSlots = rows.map(r => r.appointment_time.slice(0, 5)); // HH:MM

        // Generate slots
        const slots = [];
        let currentTime = new Date(`2000-01-01T09:00:00`);
        const endTime = new Date(`2000-01-01T19:00:00`);

        while (currentTime < endTime) {
            const timeStr = currentTime.toTimeString().slice(0, 5); // HH:MM

            // Format label (e.g., 09:00 AM)
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
            const label = `${formattedHours < 10 ? '0' + formattedHours : formattedHours}:${formattedMinutes} ${ampm}`;

            slots.push({
                time: timeStr,
                label: label,
                disabled: filledSlots.includes(timeStr)
            });

            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        res.json({ success: true, slots: slots });

    } catch (error) {
        console.error("Get Slots Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSlots = exports.handleGetSlots;

exports.getNotifications = async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.query.employee_id;
        if (!employeeId) {
            return res.json({ success: true, status: 'success', unread_count: 0, notifications: [] });
        }

        const [unreadRows] = await pool.query("SELECT COUNT(*) as count FROM notifications WHERE employee_id = ? AND is_read = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)", [employeeId]);
        const unreadCount = unreadRows[0].count;

        const [notifRows] = await pool.query(`
            SELECT notification_id, message, link_url, is_read, created_at 
            FROM notifications 
            WHERE employee_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
            ORDER BY created_at DESC 
            LIMIT 15
        `, [employeeId]);

        const notifications = notifRows.map(n => {
            const created = new Date(n.created_at);
            const now = new Date();
            const diffMs = now - created;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            let time_ago = 'Just now';
            if (diffDays > 0) time_ago = `${diffDays}d ago`;
            else if (diffHours > 0) time_ago = `${diffHours}h ago`;
            else if (diffMins > 0) time_ago = `${diffMins}m ago`;

            return { ...n, time_ago };
        });

        res.json({
            success: true,
            status: 'success',
            unread_count: unreadCount,
            notifications
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: 'Database error.' });
    }
};

exports.getPendingApprovals = async (req, res) => {
    try {
        const branchId = req.user?.branch_id || req.query.branch_id;

        if (!branchId) {
            return res.status(400).json({ success: false, status: 'error', message: "Branch ID required" });
        }

        const [pendingRegistrations] = await pool.query(`
            SELECT 
                'registration' as type,
                registration_id as id,
                patient_name,
                phone_number,
                created_at,
                consultation_amount as amount,
                status,
                approval_status,
                created_by_employee_id
            FROM registration 
            WHERE branch_id = ? 
            AND (approval_status = 'pending' OR (approval_status = 'approved' AND DATE(created_at) = CURDATE()))
            ORDER BY created_at DESC
        `, [branchId]);

        const [pendingTests] = await pool.query(`
            SELECT 
                'test' as type,
                test_id as id,
                test_uid as uid,
                patient_name,
                phone_number,
                created_at,
                total_amount as amount,
                advance_amount,
                discount as discount,
                test_name,
                approval_status,
                created_by_employee_id
            FROM tests 
            WHERE branch_id = ? 
            AND (approval_status = 'pending' OR (approval_status = 'approved' AND DATE(created_at) = CURDATE()))
            ORDER BY created_at DESC
        `, [branchId]);

        let allPending = [...pendingRegistrations, ...pendingTests];

        allPending.sort((a, b) => {
            if (a.approval_status === 'pending' && b.approval_status !== 'pending') return -1;
            if (b.approval_status === 'pending' && a.approval_status !== 'pending') return 1;
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        res.json({
            success: true,
            status: 'success',
            count: allPending.length,
            data: allPending
        });

    } catch (error) {
        console.error("GET PENDING APPROVALS EXCEPTION:", error);
        res.status(500).json({ success: false, status: 'error', message: error.message });
    }
};

exports.handleGetTreatmentSlots = async (req, res) => {
    try {
        const branchId = req.user.branch_id || req.query.branch_id;
        const date = req.query.date;
        const serviceType = req.query.service_type;

        if (!date || !serviceType) {
            return res.status(400).json({ success: false, message: 'Date and service type are required.' });
        }

        const [rows] = await pool.query(`
            SELECT time_slot, COUNT(*) as booked_count
            FROM patient_appointments
            WHERE branch_id = ?
              AND appointment_date = ?
              AND service_type = ?
            GROUP BY time_slot
        `, [branchId, date, serviceType]);

        const booked = {};
        rows.forEach(row => {
            booked[row.time_slot] = row.booked_count;
        });

        res.json({ success: true, booked });
    } catch (error) {
        console.error("Get Treatment Slots Error:", error);
        res.status(500).json({ success: false, message: 'Database error while fetching slot availability.' });
    }
};

exports.getTreatmentSlots = exports.handleGetTreatmentSlots;


