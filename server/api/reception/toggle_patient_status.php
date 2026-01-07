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
    echo json_encode(['success' => false, 'message' => 'Patient ID is required']);
    exit;
}

try {
    // 1. Get current status
    $stmt = $pdo->prepare("SELECT status FROM patients WHERE patient_id = ?");
    $stmt->execute([$patientId]);
    $currentStatus = $stmt->fetchColumn();

    if (!$currentStatus) {
        throw new Exception("Patient not found");
    }

    // 2. Toggle Status
    $newStatus = ($currentStatus === 'active') ? 'inactive' : 'active';
    
    $updateStmt = $pdo->prepare("UPDATE patients SET status = ? WHERE patient_id = ?");
    $updateStmt->execute([$newStatus, $patientId]);

    echo json_encode(['success' => true, 'new_status' => $newStatus, 'message' => "Patient marked as $newStatus"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
