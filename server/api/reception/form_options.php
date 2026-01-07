<?php
/**
 * Form Options API - Desktop Application
 * Returns all dynamic dropdown options for dashboard forms
 * Requires authentication. Standard rate limiting.
 */
declare(strict_types=1);

require_once '../../common/db.php';
require_once '../../common/security.php';

// Apply security - requires authentication
$authData = applySecurity(['requireAuth' => true]);

// Use branch_id from auth if available, otherwise from query param
$branchId = $authData['branch_id'] ?? (isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 0);

if ($branchId <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid branch_id']);
    exit;
}

try {
    $pdo->exec("SET time_zone = '+05:30'");

    // 1. Referrers (doctors from various tables)
    $stmt = $pdo->query("
        (SELECT DISTINCT reffered_by AS name FROM registration WHERE branch_id = {$branchId} AND reffered_by IS NOT NULL AND reffered_by != '')
        UNION
        (SELECT DISTINCT reffered_by AS name FROM test_inquiry WHERE branch_id = {$branchId} AND reffered_by IS NOT NULL AND reffered_by != '')
        UNION
        (SELECT DISTINCT referred_by AS name FROM tests WHERE branch_id = {$branchId} AND referred_by IS NOT NULL AND referred_by != '')
        ORDER BY name ASC
    ");
    $referrers = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Payment Methods
    $stmt = $pdo->prepare("SELECT method_code, method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $paymentMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Staff Members (for tests)
    $stmt = $pdo->prepare("SELECT staff_id, staff_name, job_title FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name");
    $stmt->execute([$branchId]);
    $staffMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Test Types
    $stmt = $pdo->prepare("SELECT test_type_id, test_name, test_code, default_cost, requires_limb_selection FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $testTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Limb Types
    $stmt = $pdo->prepare("SELECT limb_type_id, limb_name, limb_code FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $limbTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Chief Complaints
    $stmt = $pdo->prepare("SELECT complaint_code, complaint_name FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $chiefComplaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Referral Sources
    $stmt = $pdo->prepare("SELECT source_code, source_name FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $referralSources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 8. Consultation Types
    $stmt = $pdo->prepare("SELECT consultation_code, consultation_name FROM consultation_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $consultationTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 9. Inquiry Service Types
    $stmt = $pdo->prepare("SELECT service_code, service_name FROM inquiry_service_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order");
    $stmt->execute([$branchId]);
    $inquiryServiceTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 10. Time Slots (generated) with booked status
    $appointmentDate = $_GET['appointment_date'] ?? date('Y-m-d');
    $serviceType = $_GET['service_type'] ?? 'physio';
    
    // Get booked slots for the given date and service type from patient_appointments
    $stmtBooked = $pdo->prepare("
        SELECT time_slot 
        FROM patient_appointments 
        WHERE branch_id = ? AND appointment_date = ? AND service_type = ? AND status != 'cancelled'
    ");
    $stmtBooked->execute([$branchId, $appointmentDate, $serviceType]);
    $bookedSlots = $stmtBooked->fetchAll(PDO::FETCH_COLUMN);
    
    // Normalize booked slots to H:i format
    $bookedNormalized = [];
    foreach ($bookedSlots as $slot) {
        $time = strtotime($slot);
        if ($time) {
            $bookedNormalized[] = date('H:i', $time);
        }
    }
    
    $timeSlots = [];
    $capacity = ($serviceType === 'physio') ? 10 : 1;
    
    if ($serviceType === 'physio') {
        $current = strtotime('09:00');
        $end = strtotime('19:00');
        $interval = 90 * 60; // 1.5 hours
    } else {
        $current = strtotime('15:00');
        $end = strtotime('19:00');
        $interval = 60 * 60; // 1 hour
    }
    
    while ($current < $end) {
        $time24 = date('H:i', $current);
        $time12 = date('h:i A', $current);
        
        $bookedCount = 0;
        foreach ($bookedNormalized as $b) {
            if ($b === $time24) $bookedCount++;
        }
        
        $isFull = $bookedCount >= $capacity;
        
        $timeSlots[] = [
            'value' => $time24, 
            'label' => $time12,
            'booked' => $isFull,
            'booked_count' => $bookedCount,
            'capacity' => $capacity
        ];
        
        $current += $interval;
    }

    // 11. Employees (for approvals)
    $stmt = $pdo->prepare("SELECT employee_id, first_name, last_name, job_title FROM employees WHERE branch_id = ? AND is_active = 1 ORDER BY first_name ASC");
    $stmt->execute([$branchId]);
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'referrers' => $referrers,
            'paymentMethods' => $paymentMethods,
            'staffMembers' => $staffMembers,
            'testTypes' => $testTypes,
            'limbTypes' => $limbTypes,
            'chiefComplaints' => $chiefComplaints,
            'referralSources' => $referralSources,
            'consultationTypes' => $consultationTypes,
            'inquiryServiceTypes' => $inquiryServiceTypes,
            'timeSlots' => $timeSlots,
            'employees' => $employees
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
