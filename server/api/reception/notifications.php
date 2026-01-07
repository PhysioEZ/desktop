<?php
/**
 * Notifications API - Desktop Application
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

// Use employee_id from auth data
$employeeId = $authData['employee_id'] ?? $_GET['employee_id'] ?? null;

if (!$employeeId) {
    echo json_encode(['success' => true, 'status' => 'success', 'unread_count' => 0, 'notifications' => []]);
    exit;
}

$currentEmployeeId = (int)$employeeId;

try {
    // 1. Get the count of unread notifications
    $stmtUnread = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE employee_id = ? AND is_read = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)");
    $stmtUnread->execute([$currentEmployeeId]);
    $unreadCount = (int)$stmtUnread->fetchColumn();

    // 2. Get the 15 most recent notifications for the dropdown
    $stmtNotifications = $pdo->prepare(
        "SELECT notification_id, message, link_url, is_read, created_at 
         FROM notifications 
         WHERE employee_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
         ORDER BY created_at DESC 
         LIMIT 15"
    );
    $stmtNotifications->execute([$currentEmployeeId]);
    $notifications = $stmtNotifications->fetchAll(PDO::FETCH_ASSOC);

    // Format the time ago for each notification
    foreach ($notifications as &$notif) {
        $createdAt = new DateTime($notif['created_at']);
        $now = new DateTime();
        $interval = $now->diff($createdAt);
        
        if ($interval->d > 0) {
            $notif['time_ago'] = $interval->d . 'd ago';
        } elseif ($interval->h > 0) {
            $notif['time_ago'] = $interval->h . 'h ago';
        } elseif ($interval->i > 0) {
            $notif['time_ago'] = $interval->i . 'm ago';
        } else {
            $notif['time_ago'] = 'Just now';
        }
    }

    echo json_encode([
        'success' => true, 
        'status' => 'success',
        'unread_count' => $unreadCount, 
        'notifications' => $notifications
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Get Notifications Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}
