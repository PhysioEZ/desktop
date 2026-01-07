<?php
require_once '../../common/auth.php';
require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$patientId = $input['patient_id'] ?? null;
$amount = floatval($input['payment_amount'] ?? 0);
$mode = $input['mode'] ?? 'Cash';
$remarks = $input['remarks'] ?? '';
$status = $input['status'] ?? 'present'; // allowed: 'present', 'pending'

if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Handle Attendance
    $today = date('Y-m-d');
    
    // Check if record exists
    $stmtCheck = $pdo->prepare("SELECT attendance_id FROM attendance WHERE patient_id = ? AND attendance_date = ?");
    $stmtCheck->execute([$patientId, $today]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Update existing record (e.g. change pending to present if paid?)
        // If status is provided, update it.
        $stmtUpd = $pdo->prepare("UPDATE attendance SET status = ?, remarks = ? WHERE attendance_id = ?");
        $stmtUpd->execute([$status, $remarks, $existing['attendance_id']]);
    } else {
        // Insert new
        $stmtIns = $pdo->prepare("INSERT INTO attendance (patient_id, attendance_date, status, remarks, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmtIns->execute([$patientId, $today, $status, $remarks]);
    }

    // 2. Handle Payment
    if ($amount > 0) {
        // Get branch_id from patient to keep data consistent? Or session?
        // Let's use session branch_id
        $branchId = $_SESSION['branch_id'];

        $stmtPay = $pdo->prepare("INSERT INTO payments (patient_id, amount, payment_method, payment_date, remarks, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmtPay->execute([$patientId, $amount, $mode, $today, $remarks, $branchId]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Attendance marked successfully']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
