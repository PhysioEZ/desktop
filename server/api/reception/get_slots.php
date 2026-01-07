<?php
/**
 * Get Appointment Slots API - Desktop Application
 * Returns available time slots for a given date
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

$branchId = $authData['branch_id'] ?? 0;

if ($branchId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid branch_id']);
    exit;
}

// Get the date from the query parameter (e.g., ?date=2025-09-30)
// If it's not provided, default to the current date
$selectedDate = $_GET['date'] ?? date('Y-m-d');

// Basic validation to ensure it's a valid date format
if (!DateTime::createFromFormat('Y-m-d', $selectedDate)) {
    echo json_encode(['success' => false, 'message' => 'Invalid date format.']);
    exit;
}

try {
    $pdo->exec("SET time_zone = '+05:30'");

    // Fetch filled slots for the SELECTED date from registration table
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

    // Normalize filled times to H:i format
    $filledSlots = array_map(fn($t) => date('H:i', strtotime($t)), $filledSlots);

    // Generate slots (09:00 AM to 7:00 PM, every 30 minutes)
    $slots = [];
    $start = new DateTime('09:00');
    $end   = new DateTime('19:00');

    while ($start < $end) {
        $time = $start->format('H:i');
        $slots[] = [
            'time'     => $time,
            'label'    => $start->format('h:i A'),
            'disabled' => in_array($time, $filledSlots)
        ];
        $start->modify('+30 minutes');
    }

    echo json_encode(['success' => true, 'slots' => $slots]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
