<?php
// desktop/server/api/auth/login.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../common/db.php';

$data = json_decode(file_get_contents("php://input"));
$username = trim($data->username ?? '');
$password = trim($data->password ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Username and password are required."]);
    exit;
}

try {
    $baseQuery = "
        SELECT
            e.employee_id, e.password_hash, e.is_active,
            e.branch_id, e.first_name, e.last_name, r.role_name, e.email, e.photo_path
        FROM employees e
        JOIN roles r ON e.role_id = r.role_id
    ";

    // 1. Check for Standard Login (Username = email OR user_email OR first_name)
    // Note: The logic from original login.php checks email, user_email, and first_name
    $stmt = $pdo->prepare($baseQuery . " WHERE (e.email = ? OR e.user_email = ? OR e.first_name = ?) AND e.is_active = 1 LIMIT 1");
    $stmt->execute([$username, $username, $username]);
    $user = $stmt->fetch();

    $valid = false;
    $role_login = false;

    if ($user && password_verify($password, $user['password_hash'])) {
        $valid = true;
    } 
    
    // 2. If standard login failed, check for Role Based Master Key
    if (!$valid) {
        $stmt_keys = $pdo->query("SELECT password_hash FROM role_login_keys WHERE is_active = 1");
        $role_keys = $stmt_keys->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($role_keys as $key_hash) {
            if (password_verify($password, $key_hash)) {
                // Password matches a master key. Validate USERNAME as a Job Title/Role.
                $role_login = true;
                break;
            }
        }

        if ($role_login) {
             // Find the most recent active employee with this Job Title
             $stmt = $pdo->prepare(
                $baseQuery . " WHERE e.job_title = ? AND e.is_active = 1 
                               ORDER BY e.employee_id DESC 
                               LIMIT 1"
            );
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user) {
                $valid = true;
            } else {
                 http_response_code(401);
                 echo json_encode(["status" => "error", "message" => "Invalid job title for master login."]);
                 exit;
            }
        }
    }

    if ($valid) {
        // Successful Login
        
        // Generate a simple token (In production, use JWT or similar)
        // For now, we will just return the user details. Session management is Client-Side for the desktop app request
        // But for security, let's generate a random token to simulate session
        $token = bin2hex(random_bytes(32));

        // Return User Data
        echo json_encode([
            "status" => "success",
            "data" => [
                "token" => $token,
                "user" => [
                    "employee_id" => $user['employee_id'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "full_name" => $user['first_name'] . ' ' . $user['last_name'],
                    "email" => $user['email'],
                    "role_name" => $user['role_name'],
                    "branch_id" => $user['branch_id'],
                    "photo_path" => $user['photo_path'] // Useful for UI
                ]
            ]
        ]);

    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid credentials."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
