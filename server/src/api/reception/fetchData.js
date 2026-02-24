const pool = require('../../config/db');

// Main Handler for Patients Search
exports.handleSearchPatients = async (req, res) => {
    try {
        const branch_id = req.user.branch_id || req.query.branch_id;
        const searchTerm = (req.query.q || '').trim();

        if (!branch_id) {
            return res.status(400).json({ success: false, message: 'Branch ID required', results: [] });
        }

        if (!searchTerm || searchTerm.length < 2) {
            // Default: Show recent active patients
            const [rows] = await pool.query(`
                SELECT
                    p.patient_id as id,
                    r.patient_name as name,
                    r.phone_number as phone,
                    pm.patient_uid as uid,
                    'Patient' as category,
                    p.status as status,
                    p.patient_id as target_id,
                    r.gender,
                    r.age
                FROM patients p
                JOIN registration r ON p.registration_id = r.registration_id
                LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
                WHERE p.branch_id = ?
                ORDER BY p.patient_id DESC
                LIMIT 15
            `, [branch_id]);
            return res.json({ success: true, results: rows });
        }

        const p = `%${searchTerm}%`;

        const query = `
            SELECT * FROM (
                -- 1. Patients
                SELECT 
                    p.patient_id as id,
                    r.patient_name as name,
                    r.phone_number as phone,
                    pm.patient_uid as uid,
                    'Patient' as category,
                    p.status as status,
                    p.patient_id as target_id,
                    r.gender,
                    r.age,
                    p.created_at
                FROM patients p
                JOIN registration r ON p.registration_id = r.registration_id
                LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
                WHERE p.branch_id = ? AND (r.patient_name LIKE ? OR r.phone_number LIKE ? OR pm.patient_uid LIKE ?)

                UNION ALL

                -- 2. Registration (Only those not converted to patients)
                SELECT 
                    r.registration_id as id,
                    r.patient_name as name,
                    r.phone_number as phone,
                    'N/A' as uid,
                    'Registration' as category,
                    r.status as status,
                    r.registration_id as target_id,
                    r.gender,
                    r.age,
                    r.created_at
                FROM registration r
                LEFT JOIN patients p ON r.registration_id = p.registration_id
                WHERE r.branch_id = ? AND p.patient_id IS NULL AND (r.patient_name LIKE ? OR r.phone_number LIKE ?)

                UNION ALL

                -- 3. Tests
                SELECT 
                    t.test_id as id,
                    t.patient_name as name,
                    t.phone_number as phone,
                    t.test_uid as uid,
                    'Test' as category,
                    'N/A' as status,
                    t.test_id as target_id,
                    t.gender,
                    t.age,
                    t.created_at
                FROM tests t
                WHERE t.branch_id = ? AND (t.patient_name LIKE ? OR t.phone_number LIKE ? OR t.test_uid LIKE ?)

                UNION ALL

                -- 4. Inquiry (Quick)
                SELECT 
                    q.inquiry_id as id,
                    q.name as name,
                    q.phone_number as phone,
                    'N/A' as uid,
                    'Inquiry' as category,
                    q.status as status,
                    q.inquiry_id as target_id,
                    q.gender,
                    q.age,
                    q.created_at
                FROM quick_inquiry q
                WHERE q.branch_id = ? AND (q.name LIKE ? OR q.phone_number LIKE ?)

                UNION ALL

                -- 5. Inquiry (Test)
                SELECT 
                    ti.inquiry_id as id,
                    ti.name as name,
                    ti.mobile_number as phone,
                    'N/A' as uid,
                    'Inquiry' as category,
                    ti.status as status,
                    ti.inquiry_id as target_id,
                    'N/A' as gender,
                    'N/A' as age,
                    ti.created_at
                FROM test_inquiry ti
                WHERE ti.branch_id = ? AND (ti.name LIKE ? OR ti.mobile_number LIKE ?)
            ) AS combined_search
            ORDER BY 
                CASE 
                    WHEN name = ? THEN 1
                    WHEN name LIKE ? THEN 2
                    ELSE 3
                END,
                created_at DESC
            LIMIT 30
        `;

        const params = [
            branch_id, p, p, p,        // patients
            branch_id, p, p,            // registration
            branch_id, p, p, p,        // tests
            branch_id, p, p,            // inquiry quick
            branch_id, p, p,            // inquiry test
            searchTerm,                 // exact name match 1
            `${searchTerm}%`            // starts with name match 2
        ];

        const [rows] = await pool.query(query, params);
        res.json({ success: true, results: rows });

    } catch (error) {
        console.error("Unified Search Error:", error);
        res.status(500).json({ success: false, message: error.message, results: [] });
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

        const [
            [unreadRows],
            [notifRows]
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) as count FROM notifications WHERE employee_id = ? AND is_read = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)", [employeeId]),
            pool.query(`
                SELECT notification_id, message, link_url, is_read, created_at 
                FROM notifications 
                WHERE employee_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
                ORDER BY created_at DESC 
                LIMIT 15
            `, [employeeId])
        ]);
        const unreadCount = unreadRows[0].count;

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

        const [
            [pendingRegistrations],
            [pendingTests]
        ] = await Promise.all([
            pool.query(`
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
            `, [branchId]),
            pool.query(`
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
            `, [branchId])
        ]);

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


