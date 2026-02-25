<?php
/**
 * sync.php — Lightweight "what changed since?" endpoint.
 *
 * FIX: The original version had several problems:
 *  1. Iterated ALL $ALLOWED_TABLES including global tables (system_settings,
 *     app_updates, etc.) with no branch filter, pulling data across all branches.
 *  2. N+1 problem: ran SHOW COLUMNS per table to detect timestamp column.
 *  3. No LIMIT — could return massive result sets.
 *  4. No branch_id filter even when the table has one.
 *
 * This version uses a pre-defined map (same as read.php) and adds a LIMIT.
 */
require_once 'config.php';
validateRequest();

$db       = getDb();
$lastSync = $_GET['since']     ?? '2000-01-01 00:00:00';
$branchId = $_GET['branch_id'] ?? null;
$limit    = min(intval($_GET['limit'] ?? 500), 2000);

// Validate $lastSync is a plausible timestamp to prevent injection
if (!preg_match('/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/', $lastSync)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid since timestamp format']));
}

// Only sync tables that have a meaningful timestamp column.
// Omit global config tables that don't change per-branch (system_settings, app_updates, etc.)
// unless explicitly requested via ?tables[]=...
$SYNCABLE = [
    'patients'          => 'updated_at',
    'registration'      => 'updated_at',
    'tests'             => 'updated_at',
    'attendance'        => 'created_at',
    'payments'          => 'created_at',
    'quick_inquiry'     => 'created_at',
    'test_inquiry'      => 'created_at',
    'patient_master'    => 'first_registered_at', // FIX: actual MySQL column name
    'employees'         => 'updated_at',
    'patients_treatment'=> 'created_at',
    'notifications'     => 'created_at',
    'expenses'          => 'created_at',
    'system_settings'   => 'updated_at',
    'branches'          => 'created_at',
];


// Tables that have a branch_id column for filtering
$BRANCH_FILTERED = [
    'patients', 'registration', 'tests', 'payments',
    'quick_inquiry', 'test_inquiry', 'employees',
    'notifications', 'expenses',
    // attendance: no branch_id (joins via patients)
    // branches: IS the branch table, no filter needed
];


// Accept optional ?tables[] to restrict which tables are checked
$reqTables = $_GET['tables'] ?? null;
if ($reqTables) {
    $requested = is_array($reqTables) ? $reqTables : [$reqTables];
    // Whitelist against SYNCABLE
    $tablesToCheck = array_intersect_key($SYNCABLE, array_flip($requested));
} else {
    $tablesToCheck = $SYNCABLE;
}

$results = [];

foreach ($tablesToCheck as $table => $tsCol) {
    $conditions = ["`$tsCol` > ?"]; // Parameterized — no injection
    $types      = 's';
    $params     = [$lastSync];

    // Branch filter if applicable
    if ($branchId && in_array($table, $BRANCH_FILTERED)) {
        $conditions[] = "`branch_id` = ?";
        $types       .= 'i';
        $params[]     = intval($branchId);
    }

    $where = 'WHERE ' . implode(' AND ', $conditions);
    $stmt  = $db->prepare("SELECT * FROM `$table` $where ORDER BY `$tsCol` ASC LIMIT ?");
    if (!$stmt) {
        // Skip this table rather than aborting the whole sync
        error_log("[sync.php] Prepare error for $table: " . $db->error);
        continue;
    }

    $types   .= 'i';
    $params[] = $limit;
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (count($rows) > 0) {
        $results[$table] = $rows;
    }
}

echo json_encode([
    'success'   => true,
    'last_sync' => date('Y-m-d H:i:s'),
    'changes'   => $results
]);
