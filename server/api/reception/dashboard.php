<?php
// desktop/server/api/reception/dashboard.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../../common/db.php';

$branchId = $_GET['branch_id'] ?? null;
if (!$branchId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Branch ID required"]);
    exit;
}

$today = date('Y-m-d');
$startOfMonth = date('Y-m-01');
$endOfMonth = date('Y-m-t');

try {
    // -------------------------------------------------------------------------
    // AUTO-DEACTIVATION LOGIC (Same as patients.php)
    // Deactivate patients who haven't had attendance in 3+ days
    // -------------------------------------------------------------------------
    $cleanupFile = __DIR__ . '/../../tmp/last_cleanup_' . $branchId . '.txt';
    $todayDate = date('Y-m-d');
    $lastRunDate = file_exists($cleanupFile) ? file_get_contents($cleanupFile) : '';

    if (trim($lastRunDate) !== $todayDate) {
        // Deactivate patients who are 'active' but haven't visited in 3+ days
        $sqlCleanup = "UPDATE patients p
                LEFT JOIN (
                    SELECT patient_id, MAX(attendance_date) as last_visit 
                    FROM attendance 
                    GROUP BY patient_id
                ) a ON p.patient_id = a.patient_id
                SET p.status = 'inactive'
                WHERE p.branch_id = ? 
                  AND p.status = 'active'
                  AND (
                      (a.last_visit IS NOT NULL AND a.last_visit < DATE_SUB(CURDATE(), INTERVAL 3 DAY))
                      OR 
                      (a.last_visit IS NULL AND p.created_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
                  )";
        $stmtCleanup = $pdo->prepare($sqlCleanup);
        $stmtCleanup->execute([$branchId]);
        
        // Ensure tmp directory exists
        if (!is_dir(__DIR__ . '/../../tmp')) {
            @mkdir(__DIR__ . '/../../tmp', 0755, true);
        }
        @file_put_contents($cleanupFile, $todayDate);
    }

    // -------------------------------------------------------------------------
    // 1. REGISTRATION & INQUIRY CARD
    // -------------------------------------------------------------------------
    
    // Registrations Today (Total)
    $stmtRegTotal = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtRegTotal->execute([$branchId, $today]);
    $regStats['today_total'] = $stmtRegTotal->fetchColumn();

    // Registrations Pending vs Consulted (Today)
    $stmtRegStatus = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status IN ('consulted','closed') THEN 1 ELSE 0 END) as conducted
        FROM registration
        WHERE branch_id = ? AND DATE(appointment_date) = ?
    ");
    $stmtRegStatus->execute([$branchId, $today]);
    $regStatus = $stmtRegStatus->fetch(PDO::FETCH_ASSOC);
    $regStats['pending'] = (int)($regStatus['pending'] ?? 0);
    $regStats['consulted'] = (int)($regStatus['conducted'] ?? 0);

    // Total Registrations This Month
    $stmtRegMonth = $pdo->prepare("SELECT COUNT(*) FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtRegMonth->execute([$branchId, $startOfMonth, $endOfMonth]);
    $regStats['month_total'] = $stmtRegMonth->fetchColumn();

    // Inquiries Today (Total across 3 tables)
    // Note: The UI image shows 'Inquiries Today' with 'Quick' and 'Test' breakdown.
    // Based on legacy dashboard logic:
    $stmtQuick = $pdo->prepare("SELECT COUNT(*) FROM quick_inquiry WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtQuick->execute([$branchId, $today]);
    $inqStats['quick'] = (int)$stmtQuick->fetchColumn();

    $stmtTestInq = $pdo->prepare("SELECT COUNT(*) FROM test_inquiry WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtTestInq->execute([$branchId, $today]);
    $inqStats['test'] = (int)$stmtTestInq->fetchColumn();
    
    // Registration table also counts as 'Main Inquiry' often, but if the UI separates 'Registration' and 'Inquiry',
    // usually 'Inquiry' implies non-booked leads. For now, we follow the image structure.
    $inqStats['total_today'] = $inqStats['quick'] + $inqStats['test']; 

    // -------------------------------------------------------------------------
    // 2. ONGOING PATIENTS CARD
    // -------------------------------------------------------------------------
    
    // Today's Attendance (The big number on top right)
    $stmtAttended = $pdo->prepare("
        SELECT COUNT(DISTINCT a.patient_id) 
        FROM attendance a
        JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.attendance_date = ? AND p.branch_id = ?
    ");
    $stmtAttended->execute([$today, $branchId]);
    $patientStats['today_attendance'] = $stmtAttended->fetchColumn();

    // Total Patients (Ever)
    $stmtTotalPts = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = ?");
    $stmtTotalPts->execute([$branchId]);
    $patientStats['total_ever'] = $stmtTotalPts->fetchColumn();

    // Active Today vs Inactive Today (Based on status)
    // The legacy code calculated this by simple status count, not necessarily 'today's' active count,
    // but the label says "Active Today". Usually this means 'Active status' count.
    $stmtActive = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = ? AND status = 'active'");
    $stmtActive->execute([$branchId]);
    $patientStats['active'] = $stmtActive->fetchColumn();

    $stmtInactive = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = ? AND status = 'inactive'");
    $stmtInactive->execute([$branchId]);
    $patientStats['inactive'] = $stmtInactive->fetchColumn();

    // Patient Paid Today
    $stmtPtPaid = $pdo->prepare("
        SELECT SUM(p.amount) 
        FROM payments p
        JOIN patients pt ON p.patient_id = pt.patient_id
        WHERE pt.branch_id = ? AND p.payment_date = ?
    ");
    $stmtPtPaid->execute([$branchId, $today]);
    $patientStats['paid_today'] = (float)$stmtPtPaid->fetchColumn();

    // New Patients This Month
    $stmtNewRegMonth = $pdo->prepare("SELECT COUNT(*) FROM patients WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtNewRegMonth->execute([$branchId, $startOfMonth, $endOfMonth]);
    $patientStats['new_month'] = $stmtNewRegMonth->fetchColumn();


    // -------------------------------------------------------------------------
    // 3. TESTS CARD
    // -------------------------------------------------------------------------
    
    // Today's Activity (Total Tests Created Today)
    $stmtTestToday = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtTestToday->execute([$branchId, $today]);
    $testStats['today_total'] = $stmtTestToday->fetchColumn();

    // Pending vs Completed (Today)
    $stmtTestPending = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = ? AND test_status = 'pending' AND DATE(created_at) = ?");
    $stmtTestPending->execute([$branchId, $today]);
    $testStats['pending'] = (int)$stmtTestPending->fetchColumn();

    $stmtTestComp = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = ? AND test_status = 'completed' AND DATE(created_at) = ?");
    $stmtTestComp->execute([$branchId, $today]);
    $testStats['completed'] = (int)$stmtTestComp->fetchColumn();

    // Test Payments (Month Total shown in blue bar on image?) 
    // Wait, the image says "Test Payments ₹13,500". This is likely Today's Test Revenue based on context of other cards.
    // Let's get Today's Test Payment.
    $stmtTestPayToday = $pdo->prepare("SELECT SUM(advance_amount) FROM tests WHERE branch_id = ? AND DATE(visit_date) = ? AND test_status != 'cancelled'");
    $stmtTestPayToday->execute([$branchId, $today]);
    $testStats['revenue_today'] = (float)$stmtTestPayToday->fetchColumn();

    // Total Tests This Month
    $stmtTestMonth = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtTestMonth->execute([$branchId, $startOfMonth, $endOfMonth]);
    $testStats['total_month'] = $stmtTestMonth->fetchColumn();


    // -------------------------------------------------------------------------
    // 4. COLLECTIONS CARD
    // -------------------------------------------------------------------------

    // Today Reg Amount
    $stmtRegPay = $pdo->prepare("SELECT SUM(consultation_amount) FROM registration WHERE branch_id = ? AND DATE(created_at) = ? AND status != 'closed'");
    $stmtRegPay->execute([$branchId, $today]);
    $collStats['reg_amount'] = (float)$stmtRegPay->fetchColumn();

    // Today Treatment Amount (Patient Payments)
    // Already calculated as $patientStats['paid_today']
    $collStats['treatment_amount'] = $patientStats['paid_today'];

    // Today Test Amount
    // Already calculated as $testStats['revenue_today']
    $collStats['test_amount'] = $testStats['revenue_today'];

    // Today Total Amount
    $collStats['today_total'] = $collStats['reg_amount'] + $collStats['treatment_amount'] + $collStats['test_amount'];

    // Today Dues (Registration dues usually 0/minor, mostly Patient + Test Dues)
    // Patient Dues (New Packages Today)
    $stmtPtDueToday = $pdo->prepare("SELECT SUM(due_amount) FROM patients WHERE branch_id = ? AND DATE(created_at) = ? AND treatment_type = 'package'");
    $stmtPtDueToday->execute([$branchId, $today]);
    $collStats['patient_dues'] = (float)$stmtPtDueToday->fetchColumn();
    
    // Test Dues Today
    $stmtTestDueToday = $pdo->prepare("SELECT SUM(due_amount) FROM tests WHERE branch_id = ? AND DATE(created_at) = ?");
    $stmtTestDueToday->execute([$branchId, $today]);
    $collStats['test_dues'] = (float)$stmtTestDueToday->fetchColumn();
    
    // Total Dues
    $collStats['today_dues'] = $collStats['patient_dues'] + $collStats['test_dues'];

    // Total Collection This Month
    // Sum of all 3 income streams for the month
    $stmtMonthRegPay = $pdo->prepare("SELECT SUM(consultation_amount) FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?");
    $stmtMonthRegPay->execute([$branchId, $startOfMonth, $endOfMonth]);
    
    $stmtMonthTestPay = $pdo->prepare("SELECT SUM(advance_amount) FROM tests WHERE branch_id = ? AND DATE(visit_date) BETWEEN ? AND ?");
    $stmtMonthTestPay->execute([$branchId, $startOfMonth, $endOfMonth]);

    $stmtMonthPtPay = $pdo->prepare("SELECT SUM(p.amount) FROM payments p JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.branch_id = ? AND p.payment_date BETWEEN ? AND ?");
    $stmtMonthPtPay->execute([$branchId, $startOfMonth, $endOfMonth]);

    $collStats['month_total'] = (float)$stmtMonthRegPay->fetchColumn() + (float)$stmtMonthTestPay->fetchColumn() + (float)$stmtMonthPtPay->fetchColumn();


    // -------------------------------------------------------------------------
    // 5. SCHEDULE (Today's Appointments)
    // -------------------------------------------------------------------------
    $stmtSchedule = $pdo->prepare("
        SELECT 
            registration_id as id, 
            patient_name, 
            appointment_time, 
            status 
        FROM registration 
        WHERE branch_id = ? AND DATE(appointment_date) = ?
        ORDER BY appointment_time ASC LIMIT 50
    ");
    $stmtSchedule->execute([$branchId, $today]);
    $schedule = $stmtSchedule->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode([
        "status" => "success",
        "data" => [
            "registration" => $regStats,
            "inquiry" => $inqStats,
            "patients" => $patientStats,
            "tests" => $testStats,
            "tests" => $testStats,
            "collections" => $collStats,
            "schedule" => $schedule
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
