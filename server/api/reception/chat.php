<?php
/**
 * Chat API for Desktop App
 * Handles sending/receiving encrypted messages between employees
 */

declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../common/db.php';
require_once '../../common/config.php';

$action = $_GET['action'] ?? '';

// =============================
// --- ENCRYPTION HELPERS ---
// =============================
const ENCRYPTION_METHOD = 'aes-256-cbc';

function encryptMessage(string $plaintext, string $key): string {
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length(ENCRYPTION_METHOD));
    $ciphertext = openssl_encrypt($plaintext, ENCRYPTION_METHOD, $key, 0, $iv);
    return base64_encode($iv) . ':' . base64_encode($ciphertext);
}

function decryptMessage(string $payload, string $key) {
    $parts = explode(':', $payload, 2);
    if (count($parts) !== 2) return false;
    list($iv_b64, $ciphertext_b64) = $parts;
    if (!$iv_b64 || !$ciphertext_b64) return false;
    $iv = base64_decode($iv_b64);
    $ciphertext = base64_decode($ciphertext_b64);
    return openssl_decrypt($ciphertext, ENCRYPTION_METHOD, $key, 0, $iv);
}

// =============================
// --- ACTION: GET USERS ---
// =============================
if ($action === 'users') {
    $branchId = (int)($_GET['branch_id'] ?? 0);
    $currentEmployeeId = (int)($_GET['employee_id'] ?? 0);
    
    if (!$branchId || !$currentEmployeeId) {
        echo json_encode(['success' => false, 'message' => 'Missing branch_id or employee_id']);
        exit;
    }
    
    try {
        // Get all employees in the same branch (excluding current user)
        $stmt = $pdo->prepare("
            SELECT 
                e.employee_id as id,
                e.first_name as username,
                e.first_name as full_name,
                r.role_name as role,
                (
                    SELECT COUNT(*) FROM chat_messages cm 
                    WHERE cm.sender_employee_id = e.employee_id 
                    AND cm.receiver_employee_id = ? 
                    AND cm.is_read = 0
                ) as unread_count
            FROM employees e
            JOIN roles r ON e.role_id = r.role_id
            WHERE e.branch_id = ? AND e.employee_id != ? AND e.is_active = 1
            ORDER BY e.first_name ASC
        ");
        $stmt->execute([$currentEmployeeId, $branchId, $currentEmployeeId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'users' => $users]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// =============================
// --- ACTION: SEND MESSAGE ---
// =============================
if ($action === 'send') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'POST method required']);
        exit;
    }
    
    // Check if it's a FormData upload, traditional POST, or JSON
    $isFormData = (isset($_FILES['chat_file']) || !empty($_POST));
    
    if ($isFormData) {
        // Handle FormData or traditional POST
        $senderId = (int)($_POST['sender_id'] ?? 0);
        $receiverId = (int)($_POST['receiver_id'] ?? 0);
        $messageText = trim($_POST['message_text'] ?? '');
        $branchId = (int)($_POST['branch_id'] ?? 0);
        $senderName = $_POST['sender_name'] ?? 'Unknown';
        $file = $_FILES['chat_file'] ?? null;
    } else {
        // Handle JSON
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        $senderId = (int)($data['sender_id'] ?? 0);
        $receiverId = (int)($data['receiver_id'] ?? 0);
        $messageText = trim($data['message_text'] ?? '');
        $branchId = (int)($data['branch_id'] ?? 0);
        $senderName = $data['sender_name'] ?? 'Unknown';
        $file = null;
    }
    
    if (!$senderId || !$receiverId) {
        echo json_encode(['success' => false, 'message' => 'Missing sender or receiver ID']);
        exit;
    }
    
    $messageType = 'text';
    $messageContent = '';
    
    try {
        // --- Handle File Upload ---
        if ($file && $file['name'] !== '') {
            if ($file['error'] !== UPLOAD_ERR_OK) {
                switch ($file['error']) {
                    case UPLOAD_ERR_INI_SIZE:
                    case UPLOAD_ERR_FORM_SIZE:
                        $message = 'This file is too large to upload. Please try a smaller file.';
                        break;
                    case UPLOAD_ERR_PARTIAL:
                        $message = 'The upload was interrupted. Please check your connection and try again.';
                        break;
                    case UPLOAD_ERR_NO_FILE:
                        $message = 'No file was selected for upload.';
                        break;
                    default:
                        $message = 'A server error occurred during upload. Please try again later.';
                        break;
                }
                throw new Exception($message);
            }

            $uploadDir = dirname(__DIR__, 2) . '/uploads/chat_uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileType = mime_content_type($file['tmp_name']);
            $fileSize = $file['size'];
            
            $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/x-icon', 'image/svg+xml'];
            $allowedPdfTypes = ['application/pdf'];
            $allowedDocTypes = [
                'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            if (in_array($fileType, $allowedImageTypes)) {
                if ($fileSize > 10 * 1024 * 1024) throw new Exception('Images must be smaller than 10MB.');
                $messageType = 'image';
            } elseif (in_array($fileType, $allowedPdfTypes)) {
                if ($fileSize > 30 * 1024 * 1024) throw new Exception('PDF documents must be smaller than 30MB.');
                $messageType = 'pdf';
            } elseif (in_array($fileType, $allowedDocTypes)) {
                if ($fileSize > 75 * 1024 * 1024) throw new Exception('Documents must be smaller than 75MB.');
                $messageType = 'doc';
            } else {
                throw new Exception('This file format is not supported for security reasons.');
            }
            
            $safeFilename = preg_replace("/[^a-zA-Z0-9-_\.]/", "", basename($file['name']));
            $uniqueFilename = uniqid() . '-' . $safeFilename;
            $destination = $uploadDir . $uniqueFilename;
            
            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new Exception('We couldn\'t save your file. Please try again or contact support.');
            }
            
            // Store the relative path
            $messageContent = 'admin/desktop/server/uploads/chat_uploads/' . $uniqueFilename;
        }
        // --- Handle Text Message ---
        elseif (!empty($messageText)) {
            $messageType = 'text';
            $messageContent = encryptMessage($messageText, CHAT_ENCRYPTION_KEY);
        }
        // --- No content ---
        else {
            throw new Exception('Message cannot be empty.');
        }
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (sender_employee_id, receiver_employee_id, message_type, message_text) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$senderId, $receiverId, $messageType, $messageContent]);
        $messageId = $pdo->lastInsertId();
        
        // Create notification for receiver
        $notificationMessage = ($messageType === 'text')
            ? "New message from " . $senderName
            : "Sent you a file (" . $messageType . ")";
        $linkUrl = "chat_with_employee_id:" . $senderId;
        
        $stmtNotif = $pdo->prepare("
            INSERT INTO notifications (employee_id, created_by_employee_id, branch_id, message, link_url) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmtNotif->execute([$receiverId, $senderId, $branchId, $notificationMessage, $linkUrl]);
        
        echo json_encode(['success' => true, 'message_id' => $messageId]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// =============================
// --- ACTION: FETCH MESSAGES ---
// =============================
if ($action === 'fetch') {
    $currentEmployeeId = (int)($_GET['employee_id'] ?? 0);
    $partnerId = (int)($_GET['partner_id'] ?? 0);
    
    if (!$currentEmployeeId || !$partnerId) {
        echo json_encode(['success' => false, 'message' => 'Missing employee_id or partner_id']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Fetch messages
        $stmtFetch = $pdo->prepare("
            SELECT message_id, sender_employee_id, message_type, message_text, created_at, is_read 
            FROM chat_messages
            WHERE (sender_employee_id = ? AND receiver_employee_id = ?)
               OR (sender_employee_id = ? AND receiver_employee_id = ?)
            ORDER BY created_at ASC
        ");
        $stmtFetch->execute([$currentEmployeeId, $partnerId, $partnerId, $currentEmployeeId]);
        $messages = $stmtFetch->fetchAll(PDO::FETCH_ASSOC);
        
        // Decrypt and format messages
        $decryptedMessages = array_map(function ($msg) use ($currentEmployeeId) {
            if ($msg['message_type'] === 'text') {
                $decrypted = decryptMessage($msg['message_text'], CHAT_ENCRYPTION_KEY);
                $msg['message_text'] = $decrypted !== false ? $decrypted : '[Decryption failed]';
            }
            $msg['is_sender'] = (int)$msg['sender_employee_id'] === $currentEmployeeId;
            
            // Format timestamp
            if (!empty($msg['created_at'])) {
                try {
                    $dt = new DateTime($msg['created_at'], new DateTimeZone('UTC'));
                    $dt->setTimezone(new DateTimeZone('Asia/Kolkata'));
                    $msg['created_at'] = $dt->format('c');
                } catch (Exception $e) {}
            }
            
            return $msg;
        }, $messages);
        
        // Mark messages as read
        $stmtUpdate = $pdo->prepare("
            UPDATE chat_messages SET is_read = 1 
            WHERE sender_employee_id = ? AND receiver_employee_id = ? AND is_read = 0
        ");
        $stmtUpdate->execute([$partnerId, $currentEmployeeId]);
        
        // Mark related notifications as read
        $stmtUpdateNotif = $pdo->prepare("
            UPDATE notifications SET is_read = 1 
            WHERE employee_id = ? AND created_by_employee_id = ? AND is_read = 0
        ");
        $stmtUpdateNotif->execute([$currentEmployeeId, $partnerId]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'messages' => $decryptedMessages]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("Chat Fetch Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Could not retrieve messages.']);
    }
    exit;
}

// =============================
// --- ACTION: UNREAD COUNT ---
// =============================
if ($action === 'unread') {
    $employeeId = (int)($_GET['employee_id'] ?? 0);
    
    if (!$employeeId) {
        echo json_encode(['success' => false, 'message' => 'Missing employee_id']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as unread_count 
            FROM chat_messages 
            WHERE receiver_employee_id = ? AND is_read = 0
        ");
        $stmt->execute([$employeeId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'unread_count' => (int)$result['unread_count']]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    exit;
}

// Invalid action
echo json_encode(['success' => false, 'message' => 'Invalid action']);
