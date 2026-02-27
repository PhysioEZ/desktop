<?php
/**
 * PHP Bridge for PhysioEZ - Dynamic Auth Version
 */

// 1. Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'u861850327_root');
define('DB_PASS', 'Spine33#');
define('DB_NAME', 'u861850327_prospine');

// 2. System Security Token (For Node.js to Bridge communication)
$SECURITY_TOKEN = 'PhysioEZ_System_Double_Shield_2026_Security';

// 3. Allowed Tables
$ALLOWED_TABLES = [
    'patients',
    'registration',
    'tests',
    'attendance',
    'payments',
    'quick_inquiry',
    'test_inquiry',
    'monthly_budget',
    'users',
    'expenses',
    'feedback',
    'notes',
    'branches',
    'departments',
    'employees',
    'referral_partners',
    'consultations',
    'treatment_plans',
    'limb_types',
    'side_types',
    'system_settings',
    'notifications',
    'complaints',
    'categories',
    'services',
    'test_categories',
    'test_names',
    'patient_master',
    'payment_methods',
    'service_tracks',
    'roles',
    'patients_treatment', // plan history (for financial calcs)
    'app_updates',        // update notification banner
];

// 3. Helper for Hostinger (Fixes missing getallheaders)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Validates request using the api_tokens table
 */
function validateRequest() {
    $headers = getallheaders();
    // In production, the app will send: Authorization: Bearer <token>
    // Or for testing: ?token=<token>
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    } else {
        $token = $_GET['token'] ?? '';
    }

    if (empty($token)) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Token missing']));
    }

    $db = getDb();
    
    // Check if token exists, isn't expired, and isn't revoked
    $stmt = $db->prepare("SELECT employee_id FROM api_tokens WHERE token = ? AND is_revoked = 0 AND (expires_at > NOW() OR expires_at IS NULL) LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if (!$result) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Invalid or expired token']));
    }

    // Update last used time
    $db->query("UPDATE api_tokens SET last_used_at = NOW() WHERE token = '" . $db->real_escape_string($token) . "'");

    return $result['employee_id'];
}

function getDb() {
    static $db = null;
    if ($db === null) {
        $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($db->connect_error) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'DB Connection Failed: ' . $db->connect_error]));
        }
        $db->set_charset("utf8mb4");
    }
    return $db;
}

header('Content-Type: application/json');
