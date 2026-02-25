<?php
require_once 'config.php';

$db = getDb();
$table  = $_GET['table']     ?? '';
$id     = $_GET['id']        ?? null;
$limit  = min(intval($_GET['limit']  ?? 500), 1000); // FIX: cap to prevent memory exhaustion
$offset = max(intval($_GET['offset'] ?? 0), 0);       // FIX: never negative
$branchId = $_GET['branch_id']   ?? null;
$since    = $_GET['since']       ?? null;
$orderBy  = $_GET['order_by']    ?? null;


// -------------------------------------------------------
// Special case: token_me — fetch the authenticated user
// -------------------------------------------------------
if ($table === 'employees' && isset($_GET['token_me'])) {
    $employeeId = validateRequest();
    $stmt = $db->prepare("
        SELECT e.*, r.role_name 
        FROM employees e 
        LEFT JOIN roles r ON e.role_id = r.role_id 
        WHERE e.employee_id = ?
    ");
    $stmt->bind_param("i", $employeeId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $result]);
    exit;
}

// All other requests require a valid user token
validateRequest();

if (!in_array($table, $ALLOWED_TABLES)) {
    echo json_encode(['success' => false, 'message' => 'Invalid table: ' . $table]);
    exit;
}

// ------------------------------------------------------------------
// Determine which column to use for branch filtering and timestamps
// ------------------------------------------------------------------
$BRANCH_COLUMNS = [
    'patients'          => 'branch_id',
    'registration'      => 'branch_id',
    'tests'             => 'branch_id',
    // attendance: NO branch_id column — filtered via patient_id join
    'payments'          => 'branch_id',
    'quick_inquiry'     => 'branch_id',
    'test_inquiry'      => 'branch_id',
    'employees'         => 'branch_id',
    'payment_methods'   => 'branch_id',
    // branches: IS the branch table, don't filter by branch_id here
    'patients_treatment'=> null,        // no branch_id, filter by patient_id if needed
    'notifications'     => 'branch_id',
    'expenses'          => 'branch_id',
];

$TIMESTAMP_COLUMNS = [
    'patients'          => 'updated_at',
    'registration'      => 'updated_at',
    'tests'             => 'updated_at',
    'attendance'        => 'created_at',
    'payments'          => 'created_at',
    'quick_inquiry'     => 'created_at',
    'test_inquiry'      => 'created_at',
    'employees'         => 'updated_at',
    'patient_master'    => 'first_registered_at', // FIX: MySQL column is first_registered_at
    'patients_treatment'=> 'created_at',
    'notifications'     => 'created_at',
    'expenses'          => 'created_at',
    'system_settings'   => 'updated_at',
    'branches'          => 'created_at',
];



// Single record fetch
if ($id) {
    $pk = $_GET['pk'] ?? 'id';
    // FIX: validate $pk — it's user-controlled and interpolated directly into SQL
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $pk)) {
        echo json_encode(['success' => false, 'message' => 'Invalid pk column name']);
        exit;
    }
    $stmt = $db->prepare("SELECT * FROM `$table` WHERE `$pk` = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $db->error]);
        exit;
    }
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $result]);
    exit;
}


// -------------------------------------------------------
// List fetch — with optional branch_id / since filters
// -------------------------------------------------------
$conditions = [];
$paramTypes = '';
$paramValues = [];

if ($branchId && isset($BRANCH_COLUMNS[$table])) {
    $col = $BRANCH_COLUMNS[$table];
    $conditions[] = "`$col` = ?";
    $paramTypes  .= 'i';
    $paramValues[] = intval($branchId);
}

if ($since && isset($TIMESTAMP_COLUMNS[$table])) {
    $col = $TIMESTAMP_COLUMNS[$table];
    $conditions[] = "`$col` > ?";
    $paramTypes  .= 's';
    $paramValues[] = $since;
}

$where = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

// Allowed order_by columns to prevent injection
$safeOrderBy = '';
if ($orderBy && preg_match('/^[a-zA-Z_]+( (ASC|DESC))?$/', $orderBy)) {
    $safeOrderBy = "ORDER BY $orderBy";
}

$query = "SELECT * FROM `$table` $where $safeOrderBy LIMIT ? OFFSET ?";
$paramTypes  .= 'ii';
$paramValues[] = $limit;
$paramValues[] = $offset;

$stmt = $db->prepare($query);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Query error: ' . $db->error]);
    exit;
}

if (!empty($paramValues)) {
    $stmt->bind_param($paramTypes, ...$paramValues);
}

$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
echo json_encode(['success' => true, 'data' => $rows, 'count' => count($rows)]);
