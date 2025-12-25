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
    if (empty($data['patient_name']) || empty($data['test_name']) || empty($data['phone_number'])) {
        throw new Exception("Required fields are missing: Patient Name, Test Name, Phone.");
    }

    $stmt = $pdo->prepare("
        INSERT INTO test_inquiry 
        (name, testname, reffered_by, mobile_number, expected_visit_date, branch_id, created_by_employee_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['patient_name'],
        $data['test_name'],
        $data['referred_by'] ?? null,
        $data['phone_number'],
        $data['expected_visit_date'] ?? null,
        $branch_id,
        $employee_id
    ]);

    $newTestInquiryId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true, 
        "message" => "Test inquiry saved successfully.",
        "test_inquiry_id" => $newTestInquiryId
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
