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
$amount = floatval($input['amount'] ?? 0);
$method = $input['payment_method'] ?? 'cash'; // 'payment_method' or 'method'? Modal sends 'payment_method' (from store method_name)
// Check PayDuesModal: payload has "amount", "method", "remarks".
// Wait, PayDuesModal.tsx line 47: `amount: amount, method: paymentMethod, remarks: remarks`.
// My PHP should match.
$method = $input['method'] ?? $input['payment_method'] ?? 'cash';
$remarks = $input['remarks'] ?? '';
$branchId = $_SESSION['branch_id'] ?? 1; // Default or from session

if (!$patientId || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Valid patient ID and amount required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO payments (patient_id, amount, payment_method, payment_date, remarks, branch_id, created_at) VALUES (?, ?, ?, CURDATE(), ?, ?, NOW())");
    $stmt->execute([$patientId, $amount, $method, $remarks, $branchId]);

    echo json_encode(['success' => true, 'message' => 'Payment added successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
