<?php
require_once 'config.php';
validateRequest();

$db = getDb();
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || !isset($input['table']) || !isset($input['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$table  = $input['table'];
$action = $input['action'];
$data   = $input['data'] ?? null;

if (!in_array($table, $ALLOWED_TABLES)) {
    echo json_encode(['success' => false, 'message' => 'Invalid table']);
    exit;
}

if (!is_array($data) || empty($data)) {
    echo json_encode(['success' => false, 'message' => 'No data provided']);
    exit;
}

/**
 * Validate that a column name only contains safe characters.
 * This prevents SQL injection through column names, which cannot be
 * parameterized in prepared statements.
 */
function isSafeColumnName(string $col): bool {
    return (bool) preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $col);
}

if ($action === 'insert') {
    $columns = array_keys($data);
    $values  = array_values($data);

    // FIX: Validate every column name before building the query
    foreach ($columns as $col) {
        if (!isSafeColumnName($col)) {
            echo json_encode(['success' => false, 'message' => "Invalid column name: $col"]);
            exit;
        }
    }

    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $colString    = '`' . implode('`, `', $columns) . '`';

    $stmt = $db->prepare("INSERT INTO `$table` ($colString) VALUES ($placeholders)");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $db->error]);
        exit;
    }

    $types = str_repeat('s', count($values));
    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }

} elseif ($action === 'update') {
    $pk     = $input['pk']     ?? 'id';
    $pk_val = $input['pk_val'] ?? null;

    if (!isSafeColumnName($pk)) {
        echo json_encode(['success' => false, 'message' => "Invalid PK column: $pk"]);
        exit;
    }
    if ($pk_val === null) {
        echo json_encode(['success' => false, 'message' => 'pk_val is required for update']);
        exit;
    }

    unset($data[$pk]); // Don't update the PK itself
    if (empty($data)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    $sets   = [];
    $values = [];
    foreach ($data as $col => $val) {
        if (!isSafeColumnName($col)) {
            echo json_encode(['success' => false, 'message' => "Invalid column name: $col"]);
            exit;
        }
        $sets[]   = "`$col` = ?";
        $values[] = $val;
    }
    $values[] = $pk_val;

    $stmt = $db->prepare("UPDATE `$table` SET " . implode(', ', $sets) . " WHERE `$pk` = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $db->error]);
        exit;
    }

    $types = str_repeat('s', count($values));
    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'affected' => $stmt->affected_rows]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Unknown action: ' . htmlspecialchars($action)]);
}
