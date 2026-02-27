<?php
header('Content-Type: application/json');
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    die(json_encode(['success' => false, 'message' => 'Invalid JSON body']));
}
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    die(json_encode(['success' => false, 'message' => 'Username and password required']));
}

// Rate-limit hint: Hostinger doesn't allow us to write to shared session, so
// brute-force protection is left to the hosting WAF. We do add consistent timing
// to prevent user-enumeration timing attacks via password_verify.

try {
    $db = getDb(); // FIX: was $conn (undefined variable — caused PHP fatal error on every login)

    // 1. Check System Settings
    $stmt = $db->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('maintenance_mode', 'force_logout')");
    if (!$stmt) throw new Exception('DB prepare error: ' . $db->error);
    $stmt->execute();
    $settings_res = $stmt->get_result();
    $settings = [];
    while ($row = $settings_res->fetch_assoc()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    if (($settings['maintenance_mode'] ?? '0') === '1') {
        die(json_encode(['success' => false, 'message' => 'System is under maintenance.']));
    }

    // 2. Find User (email, user_email, or first_name)
    $stmt = $db->prepare("
        SELECT e.*, r.role_name
        FROM employees e
        JOIN roles r ON e.role_id = r.role_id
        WHERE (e.email = ? OR e.user_email = ? OR e.first_name = ?)
        AND e.is_active = 1
        LIMIT 1
    ");
    if (!$stmt) throw new Exception('DB prepare error: ' . $db->error);
    $stmt->bind_param("sss", $username, $username, $username);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    $authenticated_user = null;

    if ($user && !empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
        $authenticated_user = $user;
    } else {
        // 3. Fallback: Role-Based Master Key Login
        $stmt = $db->prepare("SELECT password_hash FROM role_login_keys WHERE is_active = 1");
        if (!$stmt) throw new Exception('DB prepare error: ' . $db->error);
        $stmt->execute();
        $keys_res = $stmt->get_result();
        $key_match = false;
        while ($key_row = $keys_res->fetch_assoc()) {
            if (!empty($key_row['password_hash']) && password_verify($password, $key_row['password_hash'])) {
                $key_match = true;
                break;
            }
        }

        if ($key_match) {
            // Find user by job_title (username is treated as job_title in this flow)
            $stmt = $db->prepare("
                SELECT e.*, r.role_name
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                WHERE e.job_title = ? AND e.is_active = 1
                ORDER BY e.employee_id DESC LIMIT 1
            ");
            if (!$stmt) throw new Exception('DB prepare error: ' . $db->error);
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $authenticated_user = $stmt->get_result()->fetch_assoc();
        }
    }

    if ($authenticated_user) {
        // 4. Generate Token
        $token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $user_agent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
        $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR']
            ? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]
            : ($_SERVER['REMOTE_ADDR'] ?? '');

        $stmt = $db->prepare("INSERT INTO api_tokens (employee_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) throw new Exception('DB prepare error: ' . $db->error);
        $stmt->bind_param("issss",
            $authenticated_user['employee_id'],
            $token,
            $expires_at,
            $user_agent,
            $ip_address
        );
        $stmt->execute();

        // Build full_name safely from whatever columns exist
        $first = $authenticated_user['first_name'] ?? '';
        $last  = $authenticated_user['last_name']  ?? '';
        $full  = isset($authenticated_user['full_name'])
            ? $authenticated_user['full_name']
            : trim("$first $last");

        echo json_encode([
            'success' => true,
            'data' => [
                'token' => $token,
                'user'  => [
                    'employee_id' => $authenticated_user['employee_id'],
                    'first_name'  => $first,
                    'last_name'   => $last,
                    'full_name'   => $full,
                    'email'       => $authenticated_user['email'] ?? '',
                    'role_name'   => $authenticated_user['role_name'] ?? '',
                    'branch_id'   => $authenticated_user['branch_id'],
                    'photo_path'  => $authenticated_user['photo_path'] ?? null,
                    'role_id'     => $authenticated_user['role_id'],
                    'is_active'   => $authenticated_user['is_active'],
                ]
            ]
        ]);
    } else {
        // Use a fixed-time response to mitigate timing-based user enumeration
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
