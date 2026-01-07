<?php
/**
 * Get Treatment Slots - Desktop Server API
 * Replicated legacy logic for slot fetching.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

header('Content-Type: application/json');

// Apply security - requires authentication
try {
    $authData = applySecurity(['requireAuth' => true]);
    $branchId = (int)$authData['branch_id'];
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$date = $_GET['date'] ?? null;
$serviceType = $_GET['service_type'] ?? null;

if (!$date || !$serviceType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Date and service type are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT time_slot, COUNT(*) as booked_count
        FROM patient_appointments
        WHERE branch_id = :branch_id
          AND appointment_date = :appointment_date
          AND service_type = :service_type
        GROUP BY time_slot
    ");

    $stmt->execute([
        ':branch_id' => $branchId,
        ':appointment_date' => $date,
        ':service_type' => $serviceType
    ]);

    $bookedSlots = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    echo json_encode(['success' => true, 'booked' => $bookedSlots]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Get Treatment Slots Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error while fetching slot availability.']);
}
