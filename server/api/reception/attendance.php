<?php
/**
 * Attendance API - Desktop Application
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

$authData = applySecurity(['requireAuth' => true]);

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? 'mark';

// Override branch_id
if ($authData && isset($authData['branch_id'])) {
    $input['branch_id'] = $authData['branch_id'];
}

try {
    switch ($action) {
        case 'mark':
            markAttendance($pdo, $input, $authData);
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function markAttendance($pdo, $input, $authData) {
    $patientId = $input['patient_id'] ?? null;
    $branchId = $input['branch_id'] ?? null;
    $status = $input['status'] ?? 'present'; // present, pending, absent

    if (!$patientId || !$branchId) {
        echo json_encode(['status' => 'error', 'message' => 'Missing Required Fields']);
        return;
    }

    // Check if already marked for today
    $stmtCheck = $pdo->prepare("SELECT attendance_id, status FROM attendance WHERE patient_id = ? AND attendance_date = CURDATE()");
    $stmtCheck->execute([$patientId]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] !== $status) {
            // Update status if different
            $stmtUpdate = $pdo->prepare("UPDATE attendance SET status = ? WHERE attendance_id = ?");
            $stmtUpdate->execute([$status, $existing['attendance_id']]);
            echo json_encode(['status' => 'success', 'message' => 'Attendance updated']);
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Attendance already marked']);
        }
    } else {
        // Insert new
        $stmtInsert = $pdo->prepare("INSERT INTO attendance (patient_id, attendance_date, status, created_at) VALUES (?, CURDATE(), ?, NOW())");
        $stmtInsert->execute([$patientId, $status]);
        echo json_encode(['status' => 'success', 'message' => 'Attendance marked']);
    }
}
