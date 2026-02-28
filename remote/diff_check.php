<?php
/**
 * diff_check.php — Lightweight endpoint to return MAX(ts) for all syncable tables.
 * Used for quick differential checks without pulling full datasets.
 */
require_once 'config.php';

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = (strpos($authHeader, 'Bearer ') === 0) ? substr($authHeader, 7) : ($_GET['token'] ?? '');

if ($token !== $SECURITY_TOKEN) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized: Invalid System Token']));
}

$branchId = $_GET['branch_id'] ?? null;
if (!$branchId) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'branch_id is required']));
}

$db = getDb();

// Same table map as sync.php and read.php
$SYNCABLE = [
    'patients'          => ['ts' => 'updated_at', 'branch' => 'branch_id'],
    'registration'      => ['ts' => 'updated_at', 'branch' => 'branch_id'],
    'tests'             => ['ts' => 'updated_at', 'branch' => 'branch_id'],
    'attendance'        => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'payments'          => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'quick_inquiry'     => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'test_inquiry'      => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'patient_master'    => ['ts' => 'created_at', 'branch' => 'first_registered_branch_id'],
    'employees'         => ['ts' => 'updated_at', 'branch' => 'branch_id'],
    'patients_treatment'=> ['ts' => 'created_at', 'branch' => 'patient_id'], // Need careful join if strict filtering needed
    'notifications'     => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'expenses'          => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'notes'             => ['ts' => 'created_at', 'branch' => 'branch_id'],
    'referral_partners' => ['ts' => 'updated_at', 'branch' => null],
    'branches'          => ['ts' => 'branch_id', 'branch' => 'branch_id'],
    'patient_appointments' => ['ts' => 'appointment_date', 'branch' => 'branch_id']
];

$results = [];

foreach ($SYNCABLE as $table => $meta) {
    $tsCol = $meta['ts'];
    $brCol = $meta['branch'];

    $sql = "SELECT MAX(`$tsCol`) as max_ts FROM `$table`";
    $params = [];
    $types = "";

    if ($brCol && $branchId) {
        if ($brCol === 'patient_id') {
            // Simplified: for treatment, we might just check the whole table or skip branch filtering for diff check
            // for now, let's keep it simple
            $sql .= ""; 
        } else {
            $sql .= " WHERE `$brCol` = ?";
            $params[] = intval($branchId);
            $types .= "i";
        }
    }

    $stmt = $db->prepare($sql);
    if ($stmt) {
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $results[$table] = $res['max_ts'] ?? '2000-01-01 00:00:00';
    } else {
        $results[$table] = 'error';
    }
}

echo json_encode([
    'success' => true,
    'branch_id' => $branchId,
    'server_time' => date('Y-m-d H:i:s'),
    'table_max_timestamps' => $results
]);
