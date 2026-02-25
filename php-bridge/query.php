<?php
/**
 * Universal Query Bridge
 * Acts as a simple proxy for the Node.js application to execute SQL 
 * on the remote MySQL database without needing port 3306 open.
 */
header('Content-Type: application/json');
require_once 'config.php';

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = (strpos($authHeader, 'Bearer ') === 0) ? substr($authHeader, 7) : ($_GET['token'] ?? '');

if ($token !== $SECURITY_TOKEN) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized: Invalid System Token']));
}

$input = json_decode(file_get_contents('php://input'), true);
$sql = trim($input['sql'] ?? '');
$params = $input['params'] ?? [];

if (empty($sql)) {
    die(json_encode(['success' => false, 'message' => 'No SQL provided']));
}

// Forbidden SQL commands — protect against destructive or privilege operations.
// Note: this is defence-in-depth since query.php requires $SECURITY_TOKEN (not user token).
// But let's be defensive anyway.
$forbidden = ['DROP', 'TRUNCATE', 'ALTER', 'GRANT', 'REVOKE', 'RENAME', 'LOCK', 'UNLOCK'];
foreach ($forbidden as $word) {
    if (preg_match("/\\b" . $word . "\\b/i", $sql)) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Forbidden SQL command: ' . $word]));
    }
}


try {
    $db = getDb();
    $stmt = $db->prepare($sql);
    
    if (!$stmt) {
        throw new Exception($db->error);
    }

    if (!empty($params)) {
        $types = "";
        $bindParams = [];
        foreach ($params as $p) {
            if (is_int($p)) $types .= "i";
            elseif (is_double($p)) $types .= "d";
            else $types .= "s";
            $bindParams[] = $p;
        }
        $stmt->bind_param($types, ...$bindParams);
    }

    $stmt->execute();
    if ($stmt->error) {
        throw new Exception('Execute error: ' . $stmt->error);
    }

    // Check if it's a read operation
    if (preg_match('/^(SELECT|SHOW|DESCRIBE|EXPLAIN)/i', $sql)) {
        $result = $stmt->get_result();
        $rows = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $rows]);
    } else {
        echo json_encode([
            'success' => true, 
            'data' => [
                'affectedRows' => $db->affected_rows,
                'insertId' => $db->insert_id
            ]
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
