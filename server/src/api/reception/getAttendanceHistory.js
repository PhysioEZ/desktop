const sqlite = require('../../config/sqlite');

/**
 * GET /api/reception/attendance_history?patient_id=X
 * Fully local — reads attendance + patients + registration from SQLite.
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const branchId = req.user.branch_id;

    if (!patient_id) return res.status(400).json({ success: false, message: 'Patient ID required' });
    if (!branchId) return res.status(403).json({ success: false, message: 'Branch information is missing from your session.' });

    // Verify patient belongs to this branch
    const patient = sqlite.prepare(`
            SELECT p.patient_id, r.patient_name, p.treatment_type, p.treatment_days, p.package_cost, p.start_date
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE p.patient_id = ? AND p.branch_id = ?
            LIMIT 1
        `).get(patient_id, branchId);

    if (!patient) {
      return res.status(403).json({ success: false, message: 'Access denied: Patient not found in your branch' });
    }

    // Attendance history (newest first)
    const attendanceHistory = sqlite.prepare(`
            SELECT attendance_id, patient_id, attendance_date, status, remarks, created_at, approval_request_at
            FROM attendance
            WHERE patient_id = ?
            ORDER BY attendance_id DESC
        `).all(patient_id);

    // Stats
    const presentCount = sqlite.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND status = 'present'"
    ).get(patient_id)?.count || 0;

    const totalDays = patient.treatment_days || 0;

    res.json({
      success: true,
      patient: { id: patient.patient_id, name: patient.patient_name, treatment_type: patient.treatment_type },
      history: attendanceHistory,
      stats: { present_count: presentCount, total_days: totalDays, remaining: Math.max(0, totalDays - presentCount) }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance history: ' + error.message });
  }
};
