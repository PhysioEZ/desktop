const sqlite = require('../../config/sqlite');

/**
 * GET /api/reception/attendance_data?date=YYYY-MM-DD
 * Fully local — reads from SQLite patients, registration, attendance tables.
 */
exports.getAttendanceData = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({ success: false, message: 'Branch information is missing from your session.' });
    }

    let selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    // Single query: patients + registration + latest attendance for selected date
    const attendance_records = sqlite.prepare(`
            SELECT
                p.patient_id,
                r.patient_name,
                p.treatment_type,
                p.treatment_days,
                a.attendance_id,
                a.attendance_date,
                a.remarks,
                a.status,
                (SELECT COUNT(*) FROM attendance WHERE patient_id = p.patient_id AND status = 'present') AS attendance_count,
                (SELECT MAX(attendance_date) FROM attendance WHERE patient_id = p.patient_id AND status = 'present') AS last_attendance_date
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN attendance a ON a.attendance_id = (
                SELECT MAX(attendance_id) FROM attendance
                WHERE patient_id = p.patient_id AND attendance_date = ?
            )
            WHERE p.branch_id = ?
            ORDER BY (a.attendance_id IS NOT NULL) DESC, r.patient_name ASC
        `).all(selectedDate, branchId);

    const totalPatients = attendance_records.length;
    const presentCount = attendance_records.filter(r => r.attendance_id).length;

    // Branch name from local cache
    const branch = sqlite.prepare('SELECT branch_name FROM branches WHERE branch_id = ? LIMIT 1').get(branchId);
    const branchName = branch?.branch_name || 'Reception';

    res.json({
      success: true,
      data: {
        attendance_records,
        stats: { total: totalPatients, present: presentCount, pending: totalPatients - presentCount },
        branchName,
        selectedDate,
      }
    });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance data: ' + error.message });
  }
};
