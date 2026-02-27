<?php
require_once 'config.php';
validateRequest();

$db = getDb();
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || !isset($input['operations']) || !is_array($input['operations'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

if (empty($input['operations'])) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

/**
 * Validate that a column name only contains safe characters.
 */
function isSafeColumnName(string $col): bool {
    return (bool) preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $col);
}

$db->begin_transaction();
$results = [];

try {
    foreach ($input['operations'] as $idx => $op) {
        $table  = $op['table']  ?? '';
        $action = $op['action'] ?? '';
        $data   = $op['data']   ?? null;

        if (!in_array($table, $ALLOWED_TABLES)) {
            throw new Exception("Unauthorized table at operation $idx: $table");
        }

        if (!is_array($data) || empty($data)) {
            throw new Exception("No data provided at operation $idx");
        }

        if ($action === 'insert') {
            $columns = array_keys($data);
            $values  = array_values($data);

            foreach ($columns as $col) {
                if (!isSafeColumnName($col)) {
                    throw new Exception("Invalid column name '$col' at operation $idx");
                }
            }

            $placeholders = implode(', ', array_fill(0, count($columns), '?'));
            $colString    = '`' . implode('`, `', $columns) . '`';

            $stmt = $db->prepare("INSERT INTO `$table` ($colString) VALUES ($placeholders)");
            if (!$stmt) throw new Exception("Prepare error at operation $idx: " . $db->error);

            $types = str_repeat('s', count($values));
            $stmt->bind_param($types, ...$values);
            if (!$stmt->execute()) throw new Exception("Execute error at operation $idx: " . $stmt->error);

            $results[] = ['id' => $db->insert_id, 'status' => 'success'];

        } elseif ($action === 'update') {
            $pk     = $op['pk']     ?? 'id';
            $pk_val = $op['pk_val'] ?? null;

            if (!isSafeColumnName($pk)) {
                throw new Exception("Invalid PK column '$pk' at operation $idx");
            }
            if ($pk_val === null) {
                throw new Exception("pk_val missing at operation $idx");
            }

            unset($data[$pk]);
            if (empty($data)) {
                throw new Exception("No fields to update at operation $idx");
            }

            $sets   = [];
            $values = [];
            foreach ($data as $col => $val) {
                if (!isSafeColumnName($col)) {
                    throw new Exception("Invalid column name '$col' at operation $idx");
                }
                $sets[]   = "`$col` = ?";
                $values[] = $val;
            }
            $values[] = $pk_val;

            $stmt = $db->prepare("UPDATE `$table` SET " . implode(', ', $sets) . " WHERE `$pk` = ?");
            if (!$stmt) throw new Exception("Prepare error at operation $idx: " . $db->error);

            $types = str_repeat('s', count($values));
            $stmt->bind_param($types, ...$values);
            if (!$stmt->execute()) throw new Exception("Execute error at operation $idx: " . $stmt->error);

            $results[] = ['affected' => $stmt->affected_rows, 'status' => 'success'];

        } else {
            throw new Exception("Unknown action '$action' at operation $idx");
        }
    }

    $db->commit();
    echo json_encode(['success' => true, 'results' => $results]);

} catch (Exception $e) {
    $db->rollback();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
