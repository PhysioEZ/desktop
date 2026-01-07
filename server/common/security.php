<?php
/**
 * Security Middleware for ProSpine Desktop API
 * 
 * This file provides:
 * 1. Rate Limiting - Prevents abuse by limiting requests per IP/user
 * 2. Token Authentication - Validates API tokens for authenticated endpoints
 * 3. CORS Configuration - Restricts access to allowed origins
 * 
 * Usage: require_once 'security.php'; at the top of each API file
 *        Then call: applySecurity(['requireAuth' => true/false]);
 */

declare(strict_types=1);

// ============================================================================
// CONFIGURATION
// ============================================================================

// Allowed origins for CORS - Add your production domains here
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',        // Vite dev server default
    'http://localhost:5173',        // Vite dev server alternate
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://localhost',             // Local PHP server
    'http://127.0.0.1',
    'tauri://localhost',            // Tauri desktop app
    'https://tauri.localhost',      // Tauri desktop app (secure)
    'https://prospine.in',          // Production domain
    'https://www.prospine.in',      // Production www subdomain
]);

// Rate limiting configuration
define('RATE_LIMIT_REQUESTS', 100);      // Max requests per window
define('RATE_LIMIT_WINDOW', 60);         // Window in seconds (1 minute)
define('RATE_LIMIT_STRICT_REQUESTS', 5); // Strict limit for sensitive endpoints (login)
define('RATE_LIMIT_STRICT_WINDOW', 60);  // Strict window in seconds

// Token configuration
define('TOKEN_EXPIRY_HOURS', 24);         // Token validity period

// Rate limit storage directory
define('RATE_LIMIT_DIR', __DIR__ . '/../tmp/rate_limits');

// ============================================================================
// CORS HANDLING
// ============================================================================

function applyCors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Check if origin is in allowed list
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    } else if ($origin === '') {
        // No origin (same-origin request or non-browser client)
        // For desktop apps, we might not have an origin header
        header("Access-Control-Allow-Origin: *");
    } else {
        // Origin not allowed - don't set CORS headers, browser will block
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Origin not allowed',
            'code' => 'CORS_BLOCKED'
        ]);
        exit;
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Branch-ID, X-Employee-ID");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

function getRateLimitKey(bool $useUserId = false): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    if ($useUserId) {
        // If we have a user token, use that for rate limiting instead of IP
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return 'user_' . substr(hash('sha256', $matches[1]), 0, 16);
        }
    }
    
    // Hash IP for privacy
    return 'ip_' . hash('sha256', $ip);
}

function checkRateLimit(int $maxRequests = RATE_LIMIT_REQUESTS, int $windowSeconds = RATE_LIMIT_WINDOW): bool {
    // Ensure rate limit directory exists
    if (!is_dir(RATE_LIMIT_DIR)) {
        @mkdir(RATE_LIMIT_DIR, 0755, true);
    }
    
    $key = getRateLimitKey();
    $file = RATE_LIMIT_DIR . '/' . $key . '.json';
    
    $now = time();
    $data = ['requests' => [], 'blocked_until' => 0];
    
    // Load existing data
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if ($content) {
            $data = json_decode($content, true) ?: $data;
        }
    }
    
    // Check if blocked
    if (isset($data['blocked_until']) && $data['blocked_until'] > $now) {
        $retryAfter = $data['blocked_until'] - $now;
        header("Retry-After: $retryAfter");
        http_response_code(429);
        echo json_encode([
            'status' => 'error',
            'message' => 'Too many requests. Please try again later.',
            'code' => 'RATE_LIMITED',
            'retry_after' => $retryAfter
        ]);
        exit;
    }
    
    // Clean old requests outside the window
    $data['requests'] = array_filter($data['requests'] ?? [], function($timestamp) use ($now, $windowSeconds) {
        return $timestamp > ($now - $windowSeconds);
    });
    
    // Check if over limit
    if (count($data['requests']) >= $maxRequests) {
        // Block for the window duration
        $data['blocked_until'] = $now + $windowSeconds;
        file_put_contents($file, json_encode($data));
        
        header("Retry-After: $windowSeconds");
        http_response_code(429);
        echo json_encode([
            'status' => 'error',
            'message' => 'Rate limit exceeded. Please slow down.',
            'code' => 'RATE_LIMITED',
            'retry_after' => $windowSeconds
        ]);
        exit;
    }
    
    // Add current request
    $data['requests'][] = $now;
    $data['blocked_until'] = 0;
    
    // Save updated data
    file_put_contents($file, json_encode($data));
    
    // Add rate limit headers for transparency
    $remaining = $maxRequests - count($data['requests']);
    header("X-RateLimit-Limit: $maxRequests");
    header("X-RateLimit-Remaining: $remaining");
    header("X-RateLimit-Reset: " . ($now + $windowSeconds));
    
    return true;
}

/**
 * Stricter rate limit for sensitive endpoints like login
 */
function checkStrictRateLimit(): bool {
    return checkRateLimit(RATE_LIMIT_STRICT_REQUESTS, RATE_LIMIT_STRICT_WINDOW);
}

// ============================================================================
// TOKEN AUTHENTICATION
// ============================================================================

/**
 * Validate the authentication token
 * Returns the decoded token data or null if invalid
 */
function validateAuthToken(): ?array {
    global $pdo;
    
    // Ensure we have a database connection
    if (!isset($pdo)) {
        require_once __DIR__ . '/db.php';
    }
    
    // First, check for employee_id and branch_id in headers (backward compatibility)
    // This takes priority during migration to ensure existing sessions work
    $employeeId = $_SERVER['HTTP_X_EMPLOYEE_ID'] ?? null;
    $branchId = $_SERVER['HTTP_X_BRANCH_ID'] ?? null;
    
    if ($employeeId && $branchId) {
        // Validate employee exists and is active
        try {
            $stmt = $pdo->prepare("
                SELECT e.employee_id, e.first_name, e.last_name, e.branch_id, r.role_name
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                WHERE e.employee_id = ? AND e.branch_id = ? AND e.is_active = 1
                LIMIT 1
            ");
            $stmt->execute([$employeeId, $branchId]);
            $employee = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($employee) {
                return [
                    'employee_id' => $employee['employee_id'],
                    'branch_id' => $employee['branch_id'],
                    'role' => $employee['role_name'],
                    'name' => $employee['first_name'] . ' ' . $employee['last_name']
                ];
            }
        } catch (Exception $e) {
            error_log("Employee validation error: " . $e->getMessage());
        }
    }
    
    // Check for Authorization header with Bearer token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader)) {
        return null;
    }
    
    // Extract Bearer token
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = trim($matches[1]);
    
    if (empty($token)) {
        return null;
    }
    
    try {
        // Check token in api_tokens table
        $stmt = $pdo->prepare("
            SELECT at.*, e.employee_id, e.first_name, e.last_name, e.branch_id, e.is_active, r.role_name
            FROM api_tokens at
            JOIN employees e ON at.employee_id = e.employee_id
            JOIN roles r ON e.role_id = r.role_id
            WHERE at.token = ? 
            AND at.expires_at > NOW()
            AND at.is_revoked = 0
            AND e.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tokenData) {
            // Update last used timestamp
            $updateStmt = $pdo->prepare("UPDATE api_tokens SET last_used_at = NOW() WHERE token_id = ?");
            $updateStmt->execute([$tokenData['token_id']]);
            
            return [
                'employee_id' => $tokenData['employee_id'],
                'branch_id' => $tokenData['branch_id'],
                'role' => $tokenData['role_name'],
                'name' => $tokenData['first_name'] . ' ' . $tokenData['last_name']
            ];
        }
    } catch (Exception $e) {
        // Table might not exist yet, that's okay
        error_log("Token validation error: " . $e->getMessage());
    }
    
    return null;
}

/**
 * Require authentication - exits with 401 if not authenticated
 */
function requireAuth(): array {
    $authData = validateAuthToken();
    
    if (!$authData) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Authentication required. Please login again.',
            'code' => 'UNAUTHORIZED'
        ]);
        exit;
    }
    
    return $authData;
}

/**
 * Generate a new API token for a user
 */
function generateApiToken(int $employeeId): ?string {
    global $pdo;
    
    if (!isset($pdo)) {
        require_once __DIR__ . '/db.php';
    }
    
    // Generate secure random token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));
    
    try {
        // First, ensure api_tokens table exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS api_tokens (
                token_id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                token VARCHAR(64) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                last_used_at TIMESTAMP NULL,
                is_revoked TINYINT(1) DEFAULT 0,
                user_agent VARCHAR(255) NULL,
                ip_address VARCHAR(45) NULL,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_employee_expires (employee_id, expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Revoke any existing tokens for this employee (optional - for single-session)
        // $pdo->prepare("UPDATE api_tokens SET is_revoked = 1 WHERE employee_id = ?")->execute([$employeeId]);
        
        // Insert new token
        $stmt = $pdo->prepare("
            INSERT INTO api_tokens (employee_id, token, expires_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $employeeId,
            $token,
            $expiresAt,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
        
        return $token;
    } catch (Exception $e) {
        error_log("Failed to generate API token: " . $e->getMessage());
        // Fall back to simple token
        return bin2hex(random_bytes(32));
    }
}

/**
 * Revoke a token (for logout)
 */
function revokeToken(string $token): bool {
    global $pdo;
    
    if (!isset($pdo)) {
        require_once __DIR__ . '/db.php';
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE api_tokens SET is_revoked = 1 WHERE token = ?");
        return $stmt->execute([$token]);
    } catch (Exception $e) {
        error_log("Failed to revoke token: " . $e->getMessage());
        return false;
    }
}

// ============================================================================
// MAIN SECURITY FUNCTION
// ============================================================================

/**
 * Apply all security measures
 * 
 * @param array $options Configuration options:
 *   - requireAuth: bool - Whether authentication is required (default: true)
 *   - strictRateLimit: bool - Use strict rate limiting (default: false)
 *   - skipRateLimit: bool - Skip rate limiting entirely (default: false)
 * 
 * @return array|null Returns auth data if authenticated, null if auth not required
 */
function applySecurity(array $options = []): ?array {
    $requireAuth = $options['requireAuth'] ?? true;
    $strictRateLimit = $options['strictRateLimit'] ?? false;
    $skipRateLimit = $options['skipRateLimit'] ?? false;
    
    // Set content type
    header('Content-Type: application/json; charset=UTF-8');
    
    // Apply CORS
    applyCors();
    
    // Apply rate limiting
    if (!$skipRateLimit) {
        if ($strictRateLimit) {
            checkStrictRateLimit();
        } else {
            checkRateLimit();
        }
    }
    
    // Apply authentication
    if ($requireAuth) {
        return requireAuth();
    }
    
    return validateAuthToken(); // Return auth data if present, but don't require it
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get client IP address (handles proxies)
 */
function getClientIP(): string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Log security event
 */
function logSecurityEvent(string $event, array $data = []): void {
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/security_' . date('Y-m-d') . '.log';
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'ip' => getClientIP(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => $data
    ];
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}

// Clean up old rate limit files (run occasionally)
function cleanupRateLimitFiles(): void {
    if (!is_dir(RATE_LIMIT_DIR)) return;
    
    $files = glob(RATE_LIMIT_DIR . '/*.json');
    $now = time();
    
    foreach ($files as $file) {
        // Delete files older than 1 hour
        if (filemtime($file) < ($now - 3600)) {
            @unlink($file);
        }
    }
}

// Run cleanup 1% of the time to avoid overhead
if (mt_rand(1, 100) === 1) {
    cleanupRateLimitFiles();
}
