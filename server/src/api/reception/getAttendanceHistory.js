const pool = require("../../config/db");

/**
 * Get attendance history for a specific patient
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const branchId = req.user.branch_id;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required",
      });
    }

    if (!branchId) {
      return res.status(403).json({
        success: false,
        message: "Branch information is missing from your session.",
      });
    }

    // Verify that the patient belongs to the user's branch
    const [patientCheck] = await pool.query(
      "SELECT p.patient_id, r.patient_name, p.treatment_type, p.treatment_days, p.package_cost, p.start_date " +
        "FROM patients p " +
        "JOIN registration r ON p.registration_id = r.registration_id " +
        "WHERE p.patient_id = ? AND p.branch_id = ?",
      [patient_id, branchId],
    );

    if (patientCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Patient not found in your branch",
      });
    }

    const patient = patientCheck[0];

    // Get attendance history for this patient
    const [attendanceHistory] = await pool.query(
      "SELECT attendance_id, patient_id, attendance_date, status, remarks, created_at, approval_request_at " +
        "FROM attendance " +
        "WHERE patient_id = ? " +
        "ORDER BY attendance_id DESC", // Order by newest first
      [patient_id],
    );

    // Calculate statistics
    const [presentCountResult] = await pool.query(
      "SELECT COUNT(DISTINCT SUBSTR(attendance_date, 1, 10)) as count FROM attendance WHERE patient_id = ? AND status = 'present'",
      [patient_id],
    );
    const presentCount = presentCountResult[0].count;

    const totalDays = patient.treatment_days || 0;
    const remaining = Math.max(0, totalDays - presentCount);

    // Prepare response
    const response = {
      success: true,
      patient: {
        id: patient.patient_id,
        name: patient.patient_name,
        treatment_type: patient.treatment_type,
      },
      history: attendanceHistory,
      stats: {
        present_count: presentCount,
        total_days: totalDays,
        remaining: remaining,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance history: " + error.message,
    });
  }
};
