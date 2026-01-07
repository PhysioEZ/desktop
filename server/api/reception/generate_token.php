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

if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Patient Info
    $stmt = $pdo->prepare("SELECT * FROM patients WHERE patient_id = ?");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$patient) throw new Exception("Patient not found");

    $today = date('Y-m-d');

    // 2. Check if token already exists for today?
    // Some clinics allow multiple tokens (e.g. morning/evening), some don't.
    // Legacy behavior: "Print Token" -> usually generates a NEW one or repints?
    // Let's assume re-print if exists, or just always generate new?
    // `patients.php` checks `COUNT(*) > 0` to show "check mark".
    // Let's just insert a new one for log.
    
    // Get next token number for TODAY
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM tokens WHERE token_date = ?");
    $stmtCount->execute([$today]);
    $dailyCount = $stmtCount->fetchColumn();
    $tokenNo = $dailyCount + 1;
    $tokenUid = 'TKN-' . str_pad((string)$tokenNo, 3, '0', STR_PAD_LEFT);

    // 3. Insert Token
    $stmtIns = $pdo->prepare("INSERT INTO tokens (patient_id, token_number, token_date, created_at, status) VALUES (?, ?, ?, NOW(), 'waiting')");
    $stmtIns->execute([$patientId, $tokenUid, $today]);

    // 4. Financials (For Receipt)
    $stmtPaid = $pdo->prepare("SELECT SUM(amount) FROM payments WHERE patient_id = ? AND payment_date = ?");
    $stmtPaid->execute([$patientId, $today]);
    $paidToday = $stmtPaid->fetchColumn() ?: 0;
    
    // Recalculate Balance for Receipt Accuracy
    // (Simplified copy of patients.php logic)
    $stmtPayment = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = ?");
    $stmtPayment->execute([$patientId]);
    $totalPaid = (float)$stmtPayment->fetchColumn();

    $totalConsumed = 0;
    // Hist
    $stmtHistory = $pdo->prepare("SELECT treatment_type, treatment_days, package_cost, treatment_cost_per_day, start_date, end_date FROM patients_treatment WHERE patient_id = ?");
    $stmtHistory->execute([$patientId]);
    while ($h = $stmtHistory->fetch(PDO::FETCH_ASSOC)) {
        $stmtHAtt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'");
        $stmtHAtt->execute([$patientId, $h['start_date'], $h['end_date']]);
        $hCount = (int)$stmtHAtt->fetchColumn();
        $hRate = ($h['treatment_type'] === 'package' && (int)$h['treatment_days'] > 0) ? (float)$h['package_cost'] / (int)$h['treatment_days'] : (float)$h['treatment_cost_per_day'];
        $totalConsumed += ($hCount * $hRate);
    }
    // Curr
    $curRate = ($patient['treatment_type'] === 'package' && (int)$patient['treatment_days'] > 0) ? (float)$patient['package_cost'] / (int)$patient['treatment_days'] : (float)$patient['cost_per_day'];
    $stmtCAtt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'");
    $stmtCAtt->execute([$patientId, $patient['start_date'] ?? '2000-01-01']);
    $cCount = (int)$stmtCAtt->fetchColumn();
    $totalConsumed += ($cCount * $curRate);

    $effectiveBalance = $totalPaid - $totalConsumed;
    $dueAmount = ($effectiveBalance < 0) ? abs($effectiveBalance) : 0;
    // End Calc

    $pdo->commit();

    $data = [
        'token_date' => date('d-M-Y'),
        'token_uid' => $tokenUid,
        'next_token_number' => $tokenNo,
        'patient_name' => $patient['patient_name'],
        'patient_uid' => $patient['patient_uid'],
        'patient_id' => $patient['patient_id'],
        'assigned_doctor' => $patient['assigned_doctor'],
        'visit_count' => $patient['attendance_count'],
        'attendance_progress' => $patient['attendance_count'] . '/' . $patient['treatment_days'],
        'paid_today' => $paidToday,
        'due_amount' => $dueAmount,
        'remaining_balance' => $effectiveBalance,
    ];

    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
