const DbService = require('../../services/DbService');

// Helper to calculate start/end of week
function getWeekRange(startDateStr) {
    let start = new Date(startDateStr);
    if (isNaN(start.getTime())) start = new Date(); // Fallback to now

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
    if (!branch_id) return res.status(400).json({ success: false, message: 'Branch ID required' });

    const weekStartStr = req.query.week_start;
    const { start, end } = getWeekRange(weekStartStr);

    // Format YYYY-MM-DD
    const formatDate = d => d.toISOString().split('T')[0];
    const sDate = formatDate(start);
    const eDate = formatDate(end);

    try {
        const [rows] = await DbService.query(`
            SELECT
                r.registration_id,
                r.patient_name as patient_name,
                r.appointment_date,
                r.appointment_time,
                r.status,
                r.approval_status
            FROM registration r
            WHERE r.branch_id = ?
              AND date(r.appointment_date) BETWEEN ? AND ?
              AND r.appointment_time IS NOT NULL
              AND r.status NOT IN ('closed', 'cancelled')
        `, [branch_id, sDate, eDate]);

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
        const [rows] = await DbService.query(`
            SELECT appointment_time 
            FROM registration 
            WHERE date(appointment_date) = ?
              AND branch_id = ?
              AND appointment_time IS NOT NULL
              AND status NOT IN ('closed', 'cancelled')
        `, [selectedDate, branch_id]);

        // Normalize time to HH:MM
        const filledSlots = rows.map(r => (r.appointment_time || '').substring(0, 5));

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
        // Local-first UPDATE
        await DbService.query(`
            UPDATE registration 
            SET appointment_date = ?, 
                appointment_time = ?,
                _sync_status = 'pending'
            WHERE registration_id = ? 
              AND branch_id = ?
        `, [new_date, new_time, registration_id, branch_id]);

        res.json({ success: true, message: 'Appointment rescheduled locally! Syncing with server...' });
    } catch (error) {
        console.error("Reschedule Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
