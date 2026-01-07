<?php
require_once '../../common/auth.php';
require_once '../../common/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$patientId = $input['edit_plan_patient_id'] ?? null;
// Fields
$days = $input['edit_treatment_days'] ?? null;
$slot = $input['edit_time_slot'] ?? null;
$start = $input['edit_start_date'] ?? null;
$end = $input['edit_end_date'] ?? null;
$doctor = $input['edit_assigned_doctor'] ?? null;
$discount = $input['edit_discount_percentage'] ?? null;
$remarks = $input['edit_remarks'] ?? null;

if (!$patientId) {
    echo json_encode(['success' => false, 'message' => 'Patient ID required']);
    exit;
}

try {
    // Build Dynamic Update Query
    $fields = [];
    $params = [];

    if ($days !== null) { $fields[] = "treatment_days = ?"; $params[] = $days; }
    if ($slot !== null) { $fields[] = "treatment_time_slot = ?"; $params[] = $slot; }
    if ($start !== null) { $fields[] = "start_date = ?"; $params[] = $start; }
    if ($end !== null) { $fields[] = "end_date = ?"; $params[] = $end; }
    if ($doctor !== null) { $fields[] = "assigned_doctor = ?"; $params[] = $doctor; }
    if ($discount !== null) { $fields[] = "discount_percentage = ?"; $params[] = $discount; }
    if ($remarks !== null && $remarks !== '') { 
        $fields[] = "remarks = CONCAT(remarks, ?)"; // Append remarks
        $params[] = "\n[Edit: " . $remarks . "]"; 
    }

    if (empty($fields)) {
        echo json_encode(['success' => true, 'message' => 'No changes to save']);
        exit;
    }

    $params[] = $patientId;
    $sql = "UPDATE patients SET " . implode(", ", $fields) . " WHERE patient_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Plan updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
