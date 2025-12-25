<?php
// /desktop/server/api/reception/test_connection.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../common/db.php';

try {
    // Only fetch 1 row to test
    $stmt = $pdo->query("SELECT 1 as 'connected'");
    $result = $stmt->fetch();

    if ($result) {
        echo json_encode([
            "status" => "success",
            "message" => "Connected to Database Successfully!",
            "server_time" => date('Y-m-d H:i:s'),
            "database" => "prospine"
        ]);
    } else {
        throw new Exception("Query failed.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
