const pool = require('../../config/db');

// Helper to calculate start/end of week (using IST offset)
function getWeekRange(startDateStr) {
    const getISTNow = () => new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    let start = startDateStr ? new Date(startDateStr) : getISTNow();

    if (isNaN(start.getTime())) start = getISTNow();

    const day = start.getDay();
    if (day !== 0) {
        start.setDate(start.getDate() - day);
    }
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

exports.fetchSchedule = async (req, res) => {
    const branch_id = req.user.branch_id || req.query.branch_id;
    const forceRemote = req.query.force === 'true';
    if (!branch_id) return res.status(400).json({ success: false, message: 'Branch ID required' });

    const weekStartStr = req.query.week_start;
    const { start, end } = getWeekRange(weekStartStr);

    // Format YYYY-MM-DD (Manual to avoid ISO UTC shift)
    const formatDate = d => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const sDate = formatDate(start);
    const eDate = formatDate(end);

    try {
        const query = async () => {
            return await pool.query(`
            SELECT
                r.registration_id,
                r.patient_name,
                DATE(r.appointment_date) as appointment_date,
                r.appointment_time,
                r.status,
                r.approval_status,
                pm.patient_uid
            FROM registration r
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            WHERE (r.branch_id = ? OR r.branch_id IS NULL OR r.branch_id = 0)
              AND DATE(r.appointment_date) BETWEEN ? AND ?
              AND r.appointment_time IS NOT NULL
        `, [branch_id, sDate, eDate]);
        };

        const [rows] = forceRemote
            ? await pool.queryContext.run({ forceRemote: true }, query)
            : await query();

        res.json({
            success: true,
            week_start: sDate,
            week_end: eDate,
            appointments: rows
        });
    } catch (error) {
        console.error("Fetch Schedule Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSlots = async (req, res) => {
    const branch_id = req.user.branch_id || req.query.branch_id;
    if (!branch_id) return res.status(400).json({ success: false, message: 'Branch ID required' });

    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    try {
        const [rows] = await pool.query(`
            SELECT appointment_time 
            FROM registration 
            WHERE appointment_date = ?
              AND branch_id = ?
              AND appointment_time IS NOT NULL
              AND status NOT IN ('closed', 'cancelled')
        `, [selectedDate, branch_id]);

        // Normalize time to HH:MM
        const filledSlots = rows.map(r => r.appointment_time.substring(0, 5));

        const slots = [];
        let start = new Date(`${selectedDate}T09:00:00`);
        const end = new Date(`${selectedDate}T19:00:00`);

        while (start < end) {
            const time = start.toTimeString().substring(0, 5); // HH:MM
            const label = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            slots.push({
                time,
                label,
                isBooked: filledSlots.includes(time)
            });
            start.setMinutes(start.getMinutes() + 30);
        }

        res.json({ success: true, slots });
    } catch (error) {
        console.error("Get Slots Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reschedule = async (req, res) => {
    const branch_id = req.user.branch_id || req.body.branch_id;
    if (!branch_id) return res.status(400).json({ success: false, message: 'Branch ID required' });

    const { registration_id, new_date, new_time } = req.body;
    if (!registration_id || !new_date || !new_time) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        await pool.query(`
            UPDATE registration 
            SET appointment_date = ?, 
                appointment_time = ? 
            WHERE registration_id = ? 
              AND branch_id = ?
        `, [new_date, new_time, registration_id, branch_id]);

        res.json({ success: true, message: 'Appointment rescheduled successfully!' });
    } catch (error) {
        console.error("Reschedule Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
