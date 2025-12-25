<?php
declare(strict_types=1);

require_once '../../common/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$branchId = $_GET['branch_id'] ?? null;
$searchTerm = $_GET['q'] ?? '';

if (!$branchId) {
    echo json_encode(['success' => false, 'message' => 'Branch ID required', 'patients' => []]);
    exit;
}

// If empty search term, return recent 20 patients
if (empty($searchTerm)) {
    try {
        $stmt = $pdo->prepare("
            SELECT
                p.patient_id,
                r.patient_name,
                pm.patient_uid,
                r.age,
                r.gender,
                r.phone_number,
                p.status
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            WHERE p.branch_id = :branch_id
            ORDER BY p.patient_id DESC
            LIMIT 20
        ");
        $stmt->execute([':branch_id' => $branchId]);
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'patients' => $patients]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error', 'patients' => []]);
        exit;
    }
}

// Require minimum 2 characters
if (strlen($searchTerm) < 2) {
    echo json_encode(['success' => true, 'patients' => []]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            p.patient_id,
            r.patient_name,
            pm.patient_uid,
            r.age,
            r.gender,
            r.phone_number,
            p.status
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE
            p.branch_id = :branch_id AND (
                r.patient_name LIKE :term_name OR
                pm.patient_uid LIKE :term_uid OR
                r.phone_number LIKE :term_phone
            )
        ORDER BY 
            CASE 
                WHEN r.patient_name LIKE :exact_name THEN 1
                WHEN r.patient_name LIKE :start_name THEN 2
                ELSE 3
            END,
            p.patient_id DESC
        LIMIT 15
    ");

    $stmt->execute([
        ':branch_id' => $branchId,
        ':term_name' => "%$searchTerm%",
        ':term_uid' => "%$searchTerm%",
        ':term_phone' => "%$searchTerm%",
        ':exact_name' => $searchTerm,
        ':start_name' => "$searchTerm%"
    ]);

    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'patients' => $patients]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage(), 'patients' => []]);
}

