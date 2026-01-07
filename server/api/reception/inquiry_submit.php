<?php
/**
 * Inquiry Submit API - Desktop Application
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Use branch_id and employee_id from auth data
$branch_id = $authData['branch_id'] ?? $data['branch_id'] ?? null;
$employee_id = $authData['employee_id'] ?? $data['employee_id'] ?? null;

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
