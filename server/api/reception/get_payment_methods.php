<?php
/**
 * Get Payment Methods API - Desktop Server
 * Returns active payment methods for a specific branch.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

header('Content-Type: application/json');

try {
    // Apply security - requires authentication
    $authData = applySecurity(['requireAuth' => true]);
    $branchId = (int)$authData['branch_id'];

    $stmt = $pdo->prepare("
        SELECT method_code, method_name 
        FROM payment_methods 
        WHERE branch_id = ? AND is_active = 1 
        ORDER BY display_order ASC
    ");
    $stmt->execute([$branchId]);
    $paymentMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $paymentMethods
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
