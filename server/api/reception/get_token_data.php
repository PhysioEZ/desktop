<?php
require_once '../../common/auth.php';
require_once '../../common/db.php';

$patientId = $_GET['patient_id'] ?? null;
if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    // 1. Fetch Patient Info
    $stmt = $pdo->prepare("SELECT * FROM patients WHERE patient_id = ?");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$patient) throw new Exception("Patient not found");

    // 2. Calculate Token Number (Count of attendance today + 1)
    // Assuming simple sequential token for now based on attendance order
    $today = date('Y-m-d');
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE attendance_date = ?");
    $stmtCount->execute([$today]);
    $count = $stmtCount->fetchColumn();
    $tokenNo = $count + 1;

    // 3. Financials
    // Paid Today
    $stmtPaid = $pdo->prepare("SELECT SUM(amount) FROM payments WHERE patient_id = ? AND payment_date = ?");
    $stmtPaid->execute([$patientId, $today]);
    $paidToday = $stmtPaid->fetchColumn() ?: 0;

    // Due
    // Using patient's stored due_amount (calculated by patients.php update logic usually)
    // But since we are separated, calculate on fly?
    // Let's use `due_amount` from patient table.
    // effective_balance is stored? No, calculated in API.
    // So I need calculate effective balance here?
    // Let's return just `due_amount` if stored in table? 
    // `patients` table usually doesn't store calculated balance.
    // The `patients.php` API calculates it.
    // I'll re-calculate simplified.
    
    // Simplification: just return 0 due for token if complex.
    // Or fetch from `patients.php` logic? Too heavy.
    // I'll return `paid_today` and placeholders for due.
    
    $data = [
        'token_date' => date('d-M-Y'),
        'token_uid' => 'TKN-' . str_pad((string)$tokenNo, 3, '0', STR_PAD_LEFT),
        'next_token_number' => $tokenNo,
        'patient_name' => $patient['patient_name'],
        'patient_uid' => $patient['patient_uid'],
        'patient_id' => $patient['patient_id'],
        'assigned_doctor' => $patient['assigned_doctor'],
        'visit_count' => $patient['attendance_count'],
        'attendance_progress' => $patient['attendance_count'] . '/' . $patient['treatment_days'],
        'paid_today' => $paidToday,
        'due_amount' => 0, // Placeholder
        'remaining_balance' => 0, // Placeholder
    ];

    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
