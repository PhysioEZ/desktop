const pool = require("../../config/db");

/**
 * Get attendance data for all patients in a branch for a specific date
 */
exports.getAttendanceData = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({
        success: false,
        message: "Branch information is missing from your session.",
      });
    }

    // Get the selected date from query params, default to today if not provided
    let selectedDate = req.query.date || new Date().toISOString().split("T")[0];

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (selectedDate && !dateRegex.test(selectedDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Expected YYYY-MM-DD.",
      });
    }

    // Fetch ALL patients for the branch, and LEFT JOIN attendance for the selected date
    // This allows us to see who is present and who is absent
    const query = `
            SELECT
                p.patient_id,
                r.patient_name,
                p.treatment_type,
                p.treatment_days,
                a.attendance_id,
                a.attendance_date,
                a.remarks,
                a.status,
                (
                    SELECT COUNT(*)
                    FROM attendance
                    WHERE patient_id = p.patient_id
                      AND status = 'present'
                ) AS attendance_count,
                (
                    SELECT MAX(attendance_date)
                    FROM attendance
                    WHERE patient_id = p.patient_id
                      AND status = 'present'
                ) AS last_attendance_date
            FROM
                patients p
            JOIN
                registration r ON p.registration_id = r.registration_id
            LEFT JOIN attendance a ON a.attendance_id = (
                SELECT MAX(attendance_id)
                FROM attendance
                WHERE patient_id = p.patient_id AND attendance_date = ?
            )
            WHERE
                p.branch_id = ?
            ORDER BY
                (a.attendance_id IS NOT NULL) DESC, -- Show recorded first
                r.patient_name ASC
        `;

    const [attendance_records] = await pool.query(query, [selectedDate, branchId]);

    // Calculate stats
    const totalPatients = attendance_records.length;
    const presentCount = attendance_records.filter((record) => record.attendance_id).length;
    const absentCount = totalPatients - presentCount;

    // Get branch name
    const [branchResult] = await pool.query("SELECT branch_name FROM branches WHERE branch_id = ? LIMIT 1", [branchId]);
    const branchName = branchResult[0]?.branch_name || "Reception";

    res.json({
      success: true,
      data: {
        attendance_records,
        stats: {
          total: totalPatients,
          present: presentCount,
          pending: absentCount,
        },
        branchName,
        selectedDate,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance data: " + error.message,
    });
  }
};
