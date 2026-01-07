<?php
/**
 * Schedule API - Desktop Application
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

// Get input
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Get IDs from auth data or parameters
$branchId = $authData['branch_id'] ?? (int)($_REQUEST['branch_id'] ?? $input['branch_id'] ?? 0);
$employeeId = $authData['employee_id'] ?? (int)($_REQUEST['employee_id'] ?? $input['employee_id'] ?? 0);
$action = $_GET['action'] ?? '';

if (!$branchId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Branch ID required']);
    exit;
}

// ACTION: FETCH WEEKLY SCHEDULE
if ($action === 'fetch') {
    try {
        $weekStartStr = $_GET['week_start'] ?? 'now';
        $startOfWeek = new DateTime($weekStartStr);
        
        // Ensure it starts on Sunday
        if ($startOfWeek->format('w') != 0) {
            $startOfWeek->modify('last sunday');
        }
        $startOfWeek->setTime(0, 0, 0);
        
        $endOfWeek = clone $startOfWeek;
        $endOfWeek->modify('+6 days');
        $endOfWeek->setTime(23, 59, 59);

        $stmt = $pdo->prepare("
            SELECT
                r.registration_id,
                r.patient_name,
                r.appointment_date,
                r.appointment_time,
                r.status,
                pm.patient_uid
            FROM registration r
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            WHERE r.branch_id = :branch_id
              AND r.appointment_date BETWEEN :start_date AND :end_date
              AND r.appointment_time IS NOT NULL
              AND r.status NOT IN ('closed', 'cancelled')
        ");
        $stmt->execute([
            ':branch_id' => $branchId,
            ':start_date' => $startOfWeek->format('Y-m-d'),
            ':end_date' => $endOfWeek->format('Y-m-d')
        ]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'week_start' => $startOfWeek->format('Y-m-d'),
            'week_end' => $endOfWeek->format('Y-m-d'),
            'appointments' => $appointments
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ACTION: GET AVAILABLE SLOTS
if ($action === 'slots') {
    try {
        $selectedDate = $_GET['date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT appointment_time 
            FROM registration 
            WHERE appointment_date = :selected_date
              AND branch_id = :branch_id
              AND appointment_time IS NOT NULL
              AND status NOT IN ('closed', 'cancelled')
        ");
        $stmt->execute([
            ':selected_date' => $selectedDate,
            ':branch_id' => $branchId
        ]);
        $filledSlots = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $filledSlots = array_map(fn($t) => date('H:i', strtotime($t)), $filledSlots);

        $slots = [];
        $start = new DateTime('09:00');
        $end   = new DateTime('19:00');

        while ($start < $end) {
            $time = $start->format('H:i');
            $slots[] = [
                'time'     => $time,
                'label'    => $start->format('h:i A'),
                'isBooked' => in_array($time, $filledSlots)
            ];
            $start->modify('+30 minutes');
        }

        echo json_encode(['success' => true, 'slots' => $slots]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ACTION: RESCHEDULE APPOINTMENT
if ($action === 'reschedule') {
    try {
        $registrationId = (int)($input['registration_id'] ?? 0);
        $newDate = $input['new_date'] ?? '';
        $newTime = $input['new_time'] ?? ''; // Format: HH:MM

        if (!$registrationId || !$newDate || !$newTime || !$branchId) {
            throw new Exception('Missing required fields.');
        }

        // Validate formats
        if (!DateTime::createFromFormat('Y-m-d', $newDate)) throw new Exception('Invalid date format.');
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $newTime)) throw new Exception('Invalid time format.');

        // Update database
        $stmt = $pdo->prepare("
            UPDATE registration 
            SET appointment_date = :new_date, 
                appointment_time = :new_time 
            WHERE registration_id = :reg_id 
              AND branch_id = :branch_id
        ");
        $stmt->execute([
            ':new_date' => $newDate,
            ':new_time' => $newTime,
            ':reg_id' => $registrationId,
            ':branch_id' => $branchId
        ]);

        echo json_encode(['success' => true, 'message' => 'Appointment rescheduled successfully!']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
