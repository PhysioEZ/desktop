<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

$DB_DSN  = 'mysql:host=127.0.0.1;dbname=prospine;charset=utf8mb4';
$DB_USER = 'prospine';
$DB_PASS = '1234';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($DB_DSN, $DB_USER, $DB_PASS, $options);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection error: " . $e->getMessage()]);
    exit;
}
