<?php
declare(strict_types=1);

require_once '../../common/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$branch_id = $data['branch_id'] ?? null;
$employee_id = $data['employee_id'] ?? null;

if (!$branch_id || !$employee_id) {
    echo json_encode(['success' => false, 'message' => 'Branch ID and Employee ID required']);
    exit;
}

try {
    // Validate required fields
    if (empty($data['patient_name']) || empty($data['age']) || empty($data['gender']) || empty($data['phone'])) {
        throw new Exception("Required fields are missing: Name, Age, Gender, Phone.");
    }

    $stmt = $pdo->prepare("
        INSERT INTO quick_inquiry 
        (name, age, gender, inquiry_type, communication_type, referralSource, chief_complain, phone_number, review, expected_visit_date, branch_id, created_by_employee_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['patient_name'],
        $data['age'],
        $data['gender'],
        $data['inquiry_type'] ?? null,
        $data['communication_type'] ?? null,
        $data['referralSource'] ?? 'self',
        ($data['conditionType'] === 'other' && !empty($data['conditionType_other'])) 
            ? $data['conditionType_other'] 
            : ($data['conditionType'] ?? 'other'),
        $data['phone'],
        $data['remarks'] ?? null,
        $data['expected_date'] ?? null,
        $branch_id,
        $employee_id
    ]);

    $newInquiryId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true, 
        "message" => "Inquiry saved successfully.",
        "inquiry_id" => $newInquiryId
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
