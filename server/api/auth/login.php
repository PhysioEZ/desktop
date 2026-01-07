<?php
/**
 * Login API - Desktop Application
 * 
 * This endpoint has STRICT rate limiting to prevent brute force attacks.
 * Authentication is NOT required for this endpoint (it's a login endpoint).
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security with strict rate limiting, no auth required for login
applySecurity([
    'requireAuth' => false,
    'strictRateLimit' => true  // Only 5 attempts per minute
]);

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

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
                $role_login = true;
                break;
            }
        }

        if ($role_login) {
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
                logSecurityEvent('LOGIN_FAILED_ROLE', ['username' => $username]);
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Invalid job title for master login."]);
                exit;
            }
        }
    }

    if ($valid) {
        // Generate a database-backed API token
        $token = generateApiToken((int)$user['employee_id']);
        
        // Log successful login
        logSecurityEvent('LOGIN_SUCCESS', [
            'employee_id' => $user['employee_id'],
            'username' => $username
        ]);

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
                    "photo_path" => $user['photo_path']
                ]
            ]
        ]);

    } else {
        // Log failed login attempt
        logSecurityEvent('LOGIN_FAILED', ['username' => $username]);
        
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid credentials."]);
    }

} catch (Exception $e) {
    logSecurityEvent('LOGIN_ERROR', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Please try again later."]);
}
